const User = require('./user.model')
const envConfig = require('../../config/env.config')
const { AuthError, ValidationError, NotFoundError } = require('../../errors')

const buildAuthResponse = (user) => ({
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    createdAt: user.createdAt,
})

const buildTokenResponse = async (user) => {
    const accessToken = user.createAccessToken()
    const refreshToken = user.createRefreshToken()

    user.refreshToken = refreshToken
    await user.save()

    return {
        user: buildAuthResponse(user),
        accessToken,
        token: accessToken,
        refreshToken,
    }
}

const registerUser = async (userData) => {
    const { username, email, password } = userData

    const existingUser = await User.findOne({
        $or: [{ email: email.toLowerCase() }, { username: username.trim() }],
    })

    if (existingUser) {
        throw new ValidationError('Username or email already in use')
    }

    const user = await User.create({
        username: username.trim(),
        email: email.toLowerCase().trim(),
        password,
    })

    return buildTokenResponse(user)
}

const loginUser = async (identifier, password) => {
    const isEmail = identifier.includes('@')
    const query = isEmail
        ? { email: identifier.toLowerCase().trim() }
        : { username: identifier.trim() }

    const user = await User.findOne(query)
    if (!user || !(await user.comparePassword(password))) {
        throw new AuthError('Invalid credentials')
    }

    return buildTokenResponse(user)
}

const getUserById = async (userId) => {
    const user = await User.findById(userId).select(
        '_id username email role avatar createdAt'
    )
    if (!user) throw new NotFoundError('User not found')

    return { user: buildAuthResponse(user) }
}

const DEFAULT_PUBLIC_ID =
    'default-avatar-photo-placeholder-profile-icon-vector_c0iz1k'

const updateUserAvatar = async (userId, file) => {
    if (!file) throw new ValidationError('No file uploaded')

    const user = await User.findById(userId)
    if (!user) throw new NotFoundError('User not found')

    const OAUTH_AVATARS = ['google-avatar', 'github-avatar', 'discord-avatar', 'twitter-avatar']
    if (user.avatar?.public_id && 
        user.avatar.public_id !== DEFAULT_PUBLIC_ID && 
        !OAUTH_AVATARS.includes(user.avatar.public_id)
    ) {
        const { cloudinary } = require('../../config/cloudinary')
        await cloudinary.uploader.destroy(user.avatar.public_id)
    }

    user.avatar = {
        url: file.path,
        public_id: file.filename,
    }

    await user.save()
    return { avatar: user.avatar }
}

const updateUserProfile = async (userId, updates) => {
    const user = await User.findById(userId)
    if (!user) throw new NotFoundError('User not found')

    const { username, email, currentPassword, newPassword } = updates

    if (username && username.trim() !== user.username) {
        const trimmed = username.trim()
        const taken = await User.findOne({
            username: trimmed,
            _id: { $ne: userId },
        })
        if (taken) throw new ValidationError('Username already taken')
        user.username = trimmed
    }

    if (email && email.toLowerCase().trim() !== user.email) {
        const normalized = email.toLowerCase().trim()
        const taken = await User.findOne({
            email: normalized,
            _id: { $ne: userId },
        })
        if (taken) throw new ValidationError('Email already in use')
        user.email = normalized
    }

    if (newPassword) {
        if (user.password) {
            if (!currentPassword) {
                throw new ValidationError('Current password is required to set a new password')
            }
            const isMatch = await user.comparePassword(currentPassword)
            if (!isMatch) throw new AuthError('Current password is incorrect')
        }
        user.password = newPassword
    }

    await user.save()

    return buildTokenResponse(user)
}

const googleLoginUser = async (profile) => {
    if (!profile?.id) throw new ValidationError('Google profile is required')
    const email = profile.emails?.[0]?.value?.toLowerCase()
    if (!email) throw new ValidationError('Google account email is required')

    let user = await User.findOne({ googleId: profile.id })
    if (user) return buildTokenResponse(user)

    const existingByEmail = await User.findOne({ email })
    if (existingByEmail) {
        if (!existingByEmail.googleId) {
            existingByEmail.googleId = profile.id
            await existingByEmail.save()
            return buildTokenResponse(existingByEmail)
        } else {
            throw new AuthError('email_taken_other_method', 409)
        }
    }

    const suffix = '_' + profile.id.slice(-4)
    const baseName = (profile.displayName || email.split('@')[0]).replace(/\s+/g, '_').slice(0, 20 - suffix.length)

    user = await User.create({
        username: baseName + suffix,
        email,
        googleId: profile.id,
        avatar: { url: profile.photos?.[0]?.value, public_id: 'google-avatar' },
    })

    return buildTokenResponse(user)
}

const twitterLoginUser = async (profile) => {
    if (!profile?.id) throw new ValidationError('Twitter profile is required')

    let user = await User.findOne({ xId: profile.id })
    if (user) return buildTokenResponse(user)

    const name = profile.displayName || profile.username || 'x_user'
    const email = profile.emails?.[0]?.value?.toLowerCase() || `${name.replace(/\s+/g, '').toLowerCase()}_${profile.id}@twitter.local`

    if (await User.findOne({ email })) {
        throw new AuthError('email_taken_other_method', 409)
    }

    const suffix = '_' + profile.id.slice(-4)
    const normalizedName = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
    const baseName = normalizedName.replace(/\s+/g, '_').slice(0, 20 - suffix.length)

    user = await User.create({
        username: baseName + suffix,
        email,
        xId: profile.id,
        avatar: { url: profile.photos?.[0]?.value, public_id: 'twitter-avatar' },
    })

    return buildTokenResponse(user)
}

const discordLoginUser = async (profile) => {
    if (!profile?.id) {
        throw new ValidationError('Discord profile is required')
    }

    const discordId = profile.id
    const email = profile.email?.toLowerCase()
    const username = profile.username || 'discord_user'
    const avatarHash = profile.avatar
    const picture = avatarHash
        ? `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.png`
        : null

    let user = await User.findOne({ discordId })

    if (user) {
        return buildTokenResponse(user)
    }

    if (email) {
        const existingByEmail = await User.findOne({ email })
        if (existingByEmail) {
            throw new AuthError('email_taken_other_method', 409)
        }
    }

    const suffix = '_' + discordId.slice(-4)
    const baseName = username.replace(/\s+/g, '_').slice(0, 20 - suffix.length)
    user = await User.create({
        username: baseName + suffix,
        email: email || `${baseName.toLowerCase()}_${discordId}@discord.local`,
        discordId,
        avatar: {
            url: picture || undefined,
            public_id: 'discord-avatar',
        },
    })

    return buildTokenResponse(user)
}

const githubLoginUser = async (profile) => {
    if (!profile?.id) {
        throw new ValidationError('GitHub profile is required')
    }

    const githubId = profile.id
    const email = profile.emails?.[0]?.value?.toLowerCase()
    const username = profile.username || profile.displayName || 'github_user'
    const picture = profile.photos?.[0]?.value

    let user = await User.findOne({ githubId })

    if (user) {
        return buildTokenResponse(user)
    }

    if (email) {
        const existingByEmail = await User.findOne({ email })
        if (existingByEmail) {
            throw new AuthError('email_taken_other_method', 409)
        }
    }

    const suffix = '_' + githubId.slice(-4)
    const baseName = username.replace(/\s+/g, '_').slice(0, 20 - suffix.length)

    user = await User.create({
        username: baseName + suffix,
        email: email || `${baseName.toLowerCase()}_${githubId}@github.local`,
        githubId,
        avatar: {
            url: picture || undefined,
            public_id: 'github-avatar',
        },
    })

    return buildTokenResponse(user)
}

const refreshAccessToken = async (refreshToken) => {
    if (!refreshToken) {
        throw new AuthError('Refresh token is required')
    }

    const jwt = require('jsonwebtoken')
    let payload
    try {
        payload = jwt.verify(refreshToken, envConfig.JWT_REFRESH_SECRET)
    } catch {
        throw new AuthError('Refresh token is invalid')
    }

    const user = await User.findOne({ _id: payload.userId, refreshToken })
    if (!user) {
        throw new AuthError('Refresh token is invalid')
    }

    const accessToken = user.createAccessToken()

    return {
        user: buildAuthResponse(user),
        accessToken,
        token: accessToken,
    }
}

module.exports = {
    registerUser,
    loginUser,
    getUserById,
    updateUserAvatar,
    updateUserProfile,
    googleLoginUser,
    twitterLoginUser,
    discordLoginUser,
    githubLoginUser,
    refreshAccessToken,
}

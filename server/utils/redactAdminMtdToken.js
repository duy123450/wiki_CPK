const ADMIN_MTD_TOKEN_PATH =
  /(\/api\/v1\/admin\/)(?:[a-f0-9]|%3[0-9]|%6[1-6]){64}(?=\/|[?#]|$)/

const redactAdminMtdToken = (path) =>
  path.replace(ADMIN_MTD_TOKEN_PATH, '$1[REDACTED]')

module.exports = redactAdminMtdToken

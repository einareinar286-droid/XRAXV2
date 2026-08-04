export function isMockRoleSwitcherEnabled(env = import.meta.env || {}) {
  return env.DEV === true || env.VITE_XR_ENABLE_MOCK_ROLE_SWITCHER === 'true'
}

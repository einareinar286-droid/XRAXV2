export function isMockRoleSwitcherEnabled(env = import.meta.env || {}) {
  return env.VITE_XR_ENABLE_MOCK_ROLE_SWITCHER === 'true'
}

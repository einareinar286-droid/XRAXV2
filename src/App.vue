<script>
export default {
  onLaunch() {
    console.info('[徐燃安巡] demo launched')
  }
}
</script>

<style lang="scss">
page {
  background: #f8f9fa;
  color: #191b22;
  font-family: "Manrope", "PingFang SC", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, sans-serif;
  font-variant-numeric: tabular-nums;
}

button::after { border: none; }
button { margin: 0; padding: 0; line-height: inherit; background: transparent; border-radius: 0; }
button:active { transform: scale(.98); }

.xr-shell { min-height: 100dvh; background: #f8f9fa; }
.xr-main { min-height: 100dvh; box-sizing: border-box; }
.xr-content { max-width: 1240px; margin: 0 auto; padding: 28rpx 28rpx calc(48rpx + env(safe-area-inset-bottom)); box-sizing: border-box; }
.xr-topbar { height: 104rpx; padding: 0 28rpx; display: flex; align-items: center; justify-content: space-between; gap: 20rpx; box-sizing: border-box; background: rgba(248,249,250,.96); border-bottom: 1rpx solid #edf0f3; }
.xr-mobile-brand { display: flex; align-items: center; gap: 14rpx; min-width: 0; }
.xr-mobile-mark { width: 48rpx; height: 48rpx; border-radius: 14rpx; display: flex; align-items: center; justify-content: center; background: #003c90; color: #fff; font-size: 26rpx; font-weight: 800; }
.xr-mobile-brand text { font-size: 25rpx; color: #003c90; font-weight: 750; white-space: nowrap; }
.xr-topbar-actions { display: flex; align-items: center; gap: 14rpx; }
.xr-icon-button { width: 48rpx; height: 48rpx; display: flex; align-items: center; justify-content: center; color: #46505d; font-size: 25rpx; border-radius: 50%; }
.xr-topbar-role { padding: 9rpx 14rpx; border-radius: 99rpx; background: #e8f0ff; color: #003c90; font-size: 20rpx; white-space: nowrap; }
.xr-page-title { font-size: 44rpx; line-height: 1.2; font-weight: 750; letter-spacing: -.8rpx; color: #191b22; }
.xr-page-copy { margin-top: 8rpx; color: #69707d; font-size: 23rpx; line-height: 1.6; }
.xr-card { box-sizing: border-box; background: #fff; border: 1rpx solid #edf0f3; border-radius: 18rpx; box-shadow: 0 8rpx 24rpx rgba(33,47,67,.035); }
.xr-card-muted { background: #f5f7fa; }
.xr-section-title { font-size: 30rpx; font-weight: 700; color: #191b22; }
.xr-caption { color: #69707d; font-size: 21rpx; line-height: 1.5; }
.xr-btn { min-height: 64rpx; padding: 0 22rpx; border-radius: 12rpx; display: inline-flex; align-items: center; justify-content: center; gap: 10rpx; font-size: 23rpx; font-weight: 650; box-sizing: border-box; transition: transform .18s ease, background .18s ease, opacity .18s ease; }
.xr-btn-primary { background: #003c90; color: #fff; box-shadow: 0 8rpx 16rpx rgba(15,82,186,.18); }
.xr-btn-secondary { background: #fff; color: #003c90; border: 1rpx solid #d9e2ff; }
.xr-btn-danger { background: #fff0ef; color: #c13434; border: 1rpx solid #ffd8d5; }
.xr-btn[disabled] { opacity: .45; }
.xr-status { display: inline-flex; align-items: center; justify-content: center; min-height: 36rpx; padding: 0 10rpx; border-radius: 99rpx; font-size: 18rpx; line-height: 1; font-weight: 700; box-sizing: border-box; }
.xr-status-major { color: #d43838; background: #fff0ef; }
.xr-status-warning { color: #ae6500; background: #fff6df; }
.xr-status-review { color: #006c49; background: #e8faf2; }
.xr-status-info { color: #003c90; background: #e8f0ff; }
.xr-status-muted { color: #69707d; background: #f1f3f5; }
.xr-status-closed { color: #006c49; background: #e8faf2; }
.xr-filter-row { display: flex; gap: 12rpx; overflow-x: auto; white-space: nowrap; padding: 2rpx 0 14rpx; }
.xr-filter { flex: 0 0 auto; padding: 11rpx 16rpx; border-radius: 9rpx; color: #69707d; background: #fff; border: 1rpx solid #e3e7ec; font-size: 21rpx; }
.xr-filter.active { color: #003c90; border-color: #a8c1f2; background: #e8f0ff; font-weight: 650; }
.xr-field-label { display: block; margin-bottom: 10rpx; font-size: 21rpx; font-weight: 650; color: #3f4855; }
.xr-input, .xr-textarea, .xr-select { width: 100%; box-sizing: border-box; background: #f1f3f5; border: 1rpx solid transparent; border-radius: 10rpx; color: #191b22; font-size: 23rpx; }
.xr-input, .xr-select { min-height: 68rpx; padding: 0 18rpx; }
.xr-textarea { min-height: 160rpx; padding: 16rpx 18rpx; line-height: 1.5; }
.xr-empty { padding: 92rpx 30rpx; text-align: center; color: #69707d; font-size: 23rpx; line-height: 1.65; }
.xr-denied { padding: 64rpx 30rpx; text-align: center; color: #69707d; font-size: 23rpx; line-height: 1.65; }

@media (min-width: 900px) {
  page { min-height: 100dvh; }
  .xr-main { margin-left: 208px; }
  .xr-content { max-width: 1320px; padding: 28px 32px 56px; }
  .xr-topbar { height: 56px; padding: 0 32px; }
  .xr-mobile-brand { display: none; }
  .xr-topbar-actions { margin-left: auto; }
  .xr-icon-button { width: 30px; height: 30px; font-size: 16px; }
  .xr-topbar-role { padding: 5px 10px; font-size: 11px; }
  .xr-page-title { font-size: 28px; letter-spacing: -.5px; }
  .xr-page-copy { margin-top: 5px; font-size: 13px; }
  .xr-card { border-radius: 12px; box-shadow: 0 6px 18px rgba(33,47,67,.035); }
  .xr-section-title { font-size: 16px; }
  .xr-caption { font-size: 12px; }
  .xr-btn { min-height: 34px; padding: 0 14px; border-radius: 8px; font-size: 12px; }
  .xr-status { min-height: 19px; padding: 0 7px; font-size: 10px; }
  .xr-filter-row { gap: 8px; padding-bottom: 12px; }
  .xr-filter { padding: 7px 10px; border-radius: 6px; font-size: 11px; }
  .xr-field-label { margin-bottom: 6px; font-size: 12px; }
  .xr-input, .xr-textarea, .xr-select { border-radius: 7px; font-size: 12px; }
  .xr-input, .xr-select { min-height: 38px; padding: 0 11px; }
  .xr-textarea { min-height: 96px; padding: 10px 11px; }
  .xr-empty, .xr-denied { padding: 72px 30px; font-size: 13px; }
}
</style>

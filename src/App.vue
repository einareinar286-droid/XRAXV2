<script>
export default {
  onLaunch() {
    console.info('[徐燃安巡] demo launched')
  }
}
</script>

<style lang="scss">
page {
  background: $xr-canvas;
  color: $xr-text;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
}

button::after { border: none; }

/* ============ Obsidian Cipher 全局玻璃基座 ============ */
/* 玻璃面板（中景） */
.glass-panel {
  background: $xr-glass-bg;
  backdrop-filter: $xr-blur;
  -webkit-backdrop-filter: $xr-blur;
  border: 1rpx solid $xr-line;
}
/* 玻璃面板（悬浮/高亮） */
.glass-panel-high {
  background: $xr-glass-bg-high;
  backdrop-filter: $xr-blur-high;
  -webkit-backdrop-filter: $xr-blur-high;
  border: 1rpx solid $xr-line-strong;
  border-top: 1rpx solid $xr-glass-edge;
}
/* 霓虹青辉光 */
.neon-glow-cyan { box-shadow: $xr-cyan-glow; }
/* 霓虹红辉光 */
.neon-glow-red { box-shadow: $xr-red-glow; }
/* 红色脉冲（危险态） */
.pulse-red { animation: pulseRed 2s infinite; }
@keyframes pulseRed {
  0% { box-shadow: 0 0 0 0 rgba(255, 180, 171, 0.7); }
  70% { box-shadow: 0 0 0 12rpx rgba(255, 180, 171, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 180, 171, 0); }
}

@media screen and (min-width: 1200px) {
  .uni-tabbar,
  uni-tabbar {
    display: none !important;
  }
}
</style>

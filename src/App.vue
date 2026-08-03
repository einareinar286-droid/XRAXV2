<script>
export default {
  onLaunch() {
    console.info('[徐燃安巡] demo launched')
  }
}
</script>

<style lang="scss">
page {
  background: #f4f7f6;
  color: #17201d;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
}

button::after { border: none; }

@media screen and (min-width: 1200px) {
  .uni-tabbar,
  uni-tabbar {
    display: none !important;
  }
}
</style>

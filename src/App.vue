<script>
export default {
  onLaunch() {
    console.info('[徐燃安巡] demo launched')
  }
}
</script>

<style lang="scss">
page {
  background: #f5f2ef;
  color: #211d1d;
  font-family: "PingFang SC", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, sans-serif;
  font-variant-numeric: tabular-nums;
}

button::after { border: none; }
button { transition: transform .2s ease, opacity .2s ease, background .2s ease; }
button:active { transform: scale(.98); }
@media (min-width: 900px) {
  page { min-height: 100dvh; }
}
</style>

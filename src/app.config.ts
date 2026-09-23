export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/stats/index',
    'pages/profile/index',
    'pages/growth/index'
  ],
  window: {
    backgroundTextStyle: 'dark',
    navigationBarBackgroundColor: '#fff7f2',
    navigationBarTitleText: '宝宝喂养记录',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#a39e99',
    selectedColor: '#ff8c5a',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '记录',
        iconPath: 'assets/tabbar/home.png',
        selectedIconPath: 'assets/tabbar/home-selected.png'
      },
      {
        pagePath: 'pages/stats/index',
        text: '统计',
        iconPath: 'assets/tabbar/stats.png',
        selectedIconPath: 'assets/tabbar/stats-selected.png'
      },
      {
        pagePath: 'pages/profile/index',
        text: '宝宝',
        iconPath: 'assets/tabbar/baby.png',
        selectedIconPath: 'assets/tabbar/baby-selected.png'
      }
    ]
  }
})

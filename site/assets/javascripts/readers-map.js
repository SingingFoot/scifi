/* Readers map on the Bio page: Academia.edu all-time views by country.
   Needs d3-array, d3-geo and topojson-client loaded before it.
   To refresh the numbers, edit DATA and the date in bio.html. */
(function () {
  var svg = document.getElementById('bp-map');
  if (!svg || !window.d3 || !window.topojson) return;

  /* [ISO 3166-1 numeric, English name, Ukrainian name, all-time views] */
  var DATA = [
    ['840', 'United States', 'США', 323],
    ['804', 'Ukraine', 'Україна', 297],
    ['348', 'Hungary', 'Угорщина', 126],
    ['826', 'United Kingdom', 'Велика Британія', 72],
    ['704', 'Vietnam', 'В’єтнам', 64],
    ['356', 'India', 'Індія', 50],
    ['276', 'Germany', 'Німеччина', 47],
    ['203', 'Czechia', 'Чехія', 44],
    ['076', 'Brazil', 'Бразилія', 42],
    ['124', 'Canada', 'Канада', 37],
    ['250', 'France', 'Франція', 36],
    ['616', 'Poland', 'Польща', 35],
    ['156', 'China', 'Китай', 32],
    ['036', 'Australia', 'Австралія', 29],
    ['643', 'Russian Federation', 'Російська Федерація', 29],
    ['380', 'Italy', 'Італія', 26],
    ['702', 'Singapore', 'Сінгапур', 26],
    ['056', 'Belgium', 'Бельгія', 22],
    ['792', 'Türkiye', 'Туреччина', 20],
    ['528', 'Netherlands', 'Нідерланди', 19],
    ['705', 'Slovenia', 'Словенія', 18],
    ['372', 'Ireland', 'Ірландія', 17],
    ['246', 'Finland', 'Фінляндія', 16],
    ['344', 'Hong Kong', 'Гонконг', 13],
    ['392', 'Japan', 'Японія', 13],
    ['620', 'Portugal', 'Португалія', 12],
    ['724', 'Spain', 'Іспанія', 12],
    ['484', 'Mexico', 'Мексика', 11],
    ['642', 'Romania', 'Румунія', 11],
    ['032', 'Argentina', 'Аргентина', 10],
    ['040', 'Austria', 'Австрія', 10],
    ['360', 'Indonesia', 'Індонезія', 10],
    ['170', 'Colombia', 'Колумбія', 9],
    ['050', 'Bangladesh', 'Бангладеш', 8],
    ['440', 'Lithuania', 'Литва', 8],
    ['752', 'Sweden', 'Швеція', 8],
    ['458', 'Malaysia', 'Малайзія', 7],
    ['578', 'Norway', 'Норвегія', 7],
    ['604', 'Peru', 'Перу', 7],
    ['703', 'Slovakia', 'Словаччина', 7],
    ['756', 'Switzerland', 'Швейцарія', 7],
    ['208', 'Denmark', 'Данія', 6],
    ['608', 'Philippines', 'Філіппіни', 6],
    ['682', 'Saudi Arabia', 'Саудівська Аравія', 6],
    ['710', 'South Africa', 'Південна Африка', 6],
    ['410', 'South Korea', 'Південна Корея', 6],
    ['862', 'Venezuela', 'Венесуела', 6],
    ['818', 'Egypt', 'Єгипет', 5],
    ['300', 'Greece', 'Греція', 5],
    ['554', 'New Zealand', 'Нова Зеландія', 5],
    ['586', 'Pakistan', 'Пакистан', 5],
    ['100', 'Bulgaria', 'Болгарія', 4],
    ['368', 'Iraq', 'Ірак', 4],
    ['688', 'Serbia', 'Сербія', 4],
    ['112', 'Belarus', 'Білорусь', 3],
    ['152', 'Chile', 'Чилі', 3],
    ['191', 'Croatia', 'Хорватія', 3],
    ['320', 'Guatemala', 'Гватемала', 3],
    ['364', 'Iran', 'Іран', 3],
    ['498', 'Moldova', 'Молдова', 3],
    ['504', 'Morocco', 'Марокко', 3],
    ['764', 'Thailand', 'Таїланд', 3],
    ['031', 'Azerbaijan', 'Азербайджан', 2],
    ['120', 'Cameroon', 'Камерун', 2],
    ['233', 'Estonia', 'Естонія', 2],
    ['352', 'Iceland', 'Ісландія', 2],
    ['376', 'Israel', 'Ізраїль', 2],
    ['104', 'Myanmar', 'М’янма', 2],
    ['524', 'Nepal', 'Непал', 2],
    ['558', 'Nicaragua', 'Нікарагуа', 2],
    ['800', 'Uganda', 'Уганда', 2],
    ['784', 'United Arab Emirates', 'ОАЕ', 2],
    ['008', 'Albania', 'Албанія', 1],
    ['051', 'Armenia', 'Вірменія', 1],
    ['196', 'Cyprus', 'Кіпр', 1],
    ['218', 'Ecuador', 'Еквадор', 1],
    ['268', 'Georgia', 'Грузія', 1],
    ['328', 'Guyana', 'Гаяна', 1],
    ['388', 'Jamaica', 'Ямайка', 1],
    ['400', 'Jordan', 'Йорданія', 1],
    ['417', 'Kyrgyzstan', 'Киргизстан', 1],
    ['428', 'Latvia', 'Латвія', 1],
    ['450', 'Madagascar', 'Мадагаскар', 1],
    ['470', 'Malta', 'Мальта', 1],
    ['499', 'Montenegro', 'Чорногорія', 1],
    ['566', 'Nigeria', 'Нігерія', 1],
    ['591', 'Panama', 'Панама', 1],
    ['600', 'Paraguay', 'Парагвай', 1],
    ['686', 'Senegal', 'Сенегал', 1],
    ['690', 'Seychelles', 'Сейшели', 1],
    ['158', 'Taiwan', 'Тайвань', 1],
    ['858', 'Uruguay', 'Уругвай', 1],
    ['860', 'Uzbekistan', 'Узбекистан', 1]
  ];

  /* Places too small to have a shape on the world map: [longitude, latitude] */
  var POINTS = {
    '702': [103.82, 1.35], '344': [114.17, 22.32],
    '470': [14.45, 35.9],  '690': [55.47, -4.68]
  };

  var W = 900, H = 440;
  var BREAKS = [2, 6, 16, 51, 151];
  var RAMP = ['#184f95', '#256abf', '#3987e5', '#6da7ec', '#9ec5f4', '#cde2fb'];

  var by = {}, total = 0;
  DATA.forEach(function (d) { by[d[0]] = d; total += d[3]; });

  function fill(v) {
    for (var i = 0; i < BREAKS.length; i++) if (v < BREAKS[i]) return RAMP[i];
    return RAMP[RAMP.length - 1];
  }
  function lang() { return document.documentElement.getAttribute('data-lang') === 'ua' ? 'ua' : 'en'; }
  function viewsLabel(n) {
    if (lang() !== 'ua') return n + (n === 1 ? ' view' : ' views');
    var a = n % 10, b = n % 100;
    if (a === 1 && b !== 11) return n + ' перегляд';
    if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return n + ' перегляди';
    return n + ' переглядів';
  }
  function share(n) {
    var s = (100 * n / total).toFixed(1);
    return (lang() === 'ua' ? s.replace('.', ',') : s) + '%';
  }
  function name(d) { return lang() === 'ua' ? d[2] : d[1]; }

  /* ── Tooltip ── */
  var tip = document.getElementById('bp-map-tip');
  function showTip(e, d) {
    tip.innerHTML = '<strong>' + name(d) + '</strong>' + viewsLabel(d[3]) + ' <span>· ' + share(d[3]) + '</span>';
    tip.style.display = 'block';
    var x = e.clientX + 14, y = e.clientY + 14;
    if (x + tip.offsetWidth > window.innerWidth - 8) x = e.clientX - tip.offsetWidth - 10;
    if (y + tip.offsetHeight > window.innerHeight - 8) y = e.clientY - tip.offsetHeight - 10;
    tip.style.left = Math.max(8, x) + 'px';
    tip.style.top = Math.max(8, y) + 'px';
  }
  function hideTip() { tip.style.display = 'none'; }
  function bind(el, d) {
    el.addEventListener('pointermove', function (e) { showTip(e, d); });
    el.addEventListener('pointerleave', hideTip);
    el.addEventListener('click', function (e) { showTip(e, d); e.stopPropagation(); });
  }
  document.addEventListener('click', hideTip);
  window.addEventListener('scroll', hideTip, { passive: true });

  /* ── Table of all countries (also the non-visual alternative to the map) ── */
  function renderTable() {
    var body = document.getElementById('bp-map-rows');
    if (!body) return;
    body.innerHTML = DATA.map(function (d, i) {
      return '<tr><td>' + (i + 1) + '</td><td>' + name(d) + '</td><td>' + d[3] + '</td><td>' + share(d[3]) + '</td></tr>';
    }).join('');
  }
  renderTable();
  if ('MutationObserver' in window) {
    new MutationObserver(renderTable).observe(document.documentElement, { attributes: true, attributeFilter: ['data-lang'] });
  }

  /* ── Map ── */
  var NS = 'http://www.w3.org/2000/svg';
  function node(tag, attrs) {
    var el = document.createElementNS(NS, tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }
  function dot(xy, d) {
    var c = node('circle', { 'class': 'bp-map-dot', cx: xy[0], cy: xy[1], r: 4, fill: fill(d[3]) });
    bind(c, d);
    return c;
  }

  fetch(svg.getAttribute('data-src'))
    .then(function (r) { return r.json(); })
    .then(function (world) {
      var feats = topojson.feature(world, world.objects.countries).features
        .filter(function (f) { return f.id !== '010'; });               /* no Antarctica */
      var proj = d3.geoNaturalEarth1().fitExtent([[4, 4], [W - 4, H - 4]], { type: 'FeatureCollection', features: feats });
      var path = d3.geoPath(proj);
      var dots = [];

      feats.forEach(function (f) {
        var d = by[f.id];
        var p = node('path', { d: path(f), 'class': 'bp-map-c' + (d ? ' bp-map-has' : '') });
        if (d) {
          p.style.fill = fill(d[3]);
          bind(p, d);
          if (path.area(f) < 10) dots.push(dot(path.centroid(f), d));
        }
        svg.appendChild(p);
      });
      Object.keys(POINTS).forEach(function (id) {
        if (by[id]) dots.push(dot(proj(POINTS[id]), by[id]));
      });
      dots.forEach(function (c) { svg.appendChild(c); });
    })
    .catch(function () {
      var wrap = document.getElementById('bp-map-wrap');
      if (wrap) wrap.style.display = 'none';
      var all = document.getElementById('bp-map-all');
      if (all) all.open = true;                                           /* fall back to the table */
    });
}());

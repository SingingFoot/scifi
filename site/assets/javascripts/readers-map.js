/* Readers map on the Bio page: Academia.edu all-time views by country.
   Needs d3-array, d3-geo and topojson-client loaded before it.
   To refresh the numbers, edit DATA and the date in bio.html. */
(function () {
  var svg = document.getElementById('bp-map');
  if (!svg || !window.d3 || !window.topojson) return;

  /* [ISO 3166-1 numeric, English name, Ukrainian name, all-time views] */
  var DATA = [
    ['840', 'United States', 'США', 350],
    ['804', 'Ukraine', 'Україна', 312],
    ['348', 'Hungary', 'Угорщина', 130],
    ['826', 'United Kingdom', 'Велика Британія', 72],
    ['704', 'Vietnam', 'В’єтнам', 66],
    ['356', 'India', 'Індія', 54],
    ['276', 'Germany', 'Німеччина', 49],
    ['076', 'Brazil', 'Бразилія', 45],
    ['203', 'Czechia', 'Чехія', 45],
    ['250', 'France', 'Франція', 38],
    ['124', 'Canada', 'Канада', 37],
    ['616', 'Poland', 'Польща', 35],
    ['156', 'China', 'Китай', 33],
    ['380', 'Italy', 'Італія', 31],
    ['036', 'Australia', 'Австралія', 30],
    ['643', 'Russian Federation', 'Російська Федерація', 29],
    ['702', 'Singapore', 'Сінгапур', 26],
    ['056', 'Belgium', 'Бельгія', 24],
    ['528', 'Netherlands', 'Нідерланди', 21],
    ['792', 'Türkiye', 'Туреччина', 20],
    ['705', 'Slovenia', 'Словенія', 18],
    ['372', 'Ireland', 'Ірландія', 17],
    ['246', 'Finland', 'Фінляндія', 16],
    ['392', 'Japan', 'Японія', 15],
    ['344', 'Hong Kong', 'Гонконг', 13],
    ['724', 'Spain', 'Іспанія', 13],
    ['620', 'Portugal', 'Португалія', 12],
    ['032', 'Argentina', 'Аргентина', 11],
    ['170', 'Colombia', 'Колумбія', 11],
    ['360', 'Indonesia', 'Індонезія', 11],
    ['484', 'Mexico', 'Мексика', 11],
    ['642', 'Romania', 'Румунія', 11],
    ['040', 'Austria', 'Австрія', 10],
    ['050', 'Bangladesh', 'Бангладеш', 9],
    ['608', 'Philippines', 'Філіппіни', 9],
    ['440', 'Lithuania', 'Литва', 8],
    ['752', 'Sweden', 'Швеція', 8],
    ['458', 'Malaysia', 'Малайзія', 7],
    ['578', 'Norway', 'Норвегія', 7],
    ['604', 'Peru', 'Перу', 7],
    ['703', 'Slovakia', 'Словаччина', 7],
    ['756', 'Switzerland', 'Швейцарія', 7],
    ['208', 'Denmark', 'Данія', 6],
    ['586', 'Pakistan', 'Пакистан', 6],
    ['682', 'Saudi Arabia', 'Саудівська Аравія', 6],
    ['710', 'South Africa', 'Південна Африка', 6],
    ['410', 'South Korea', 'Південна Корея', 6],
    ['862', 'Venezuela', 'Венесуела', 6],
    ['100', 'Bulgaria', 'Болгарія', 5],
    ['152', 'Chile', 'Чилі', 5],
    ['818', 'Egypt', 'Єгипет', 5],
    ['300', 'Greece', 'Греція', 5],
    ['554', 'New Zealand', 'Нова Зеландія', 5],
    ['368', 'Iraq', 'Ірак', 4],
    ['688', 'Serbia', 'Сербія', 4],
    ['112', 'Belarus', 'Білорусь', 3],
    ['191', 'Croatia', 'Хорватія', 3],
    ['320', 'Guatemala', 'Гватемала', 3],
    ['364', 'Iran', 'Іран', 3],
    ['498', 'Moldova', 'Молдова', 3],
    ['504', 'Morocco', 'Марокко', 3],
    ['524', 'Nepal', 'Непал', 3],
    ['764', 'Thailand', 'Таїланд', 3],
    ['784', 'United Arab Emirates', 'ОАЕ', 3],
    ['031', 'Azerbaijan', 'Азербайджан', 2],
    ['120', 'Cameroon', 'Камерун', 2],
    ['233', 'Estonia', 'Естонія', 2],
    ['352', 'Iceland', 'Ісландія', 2],
    ['376', 'Israel', 'Ізраїль', 2],
    ['104', 'Myanmar', 'М’янма', 2],
    ['558', 'Nicaragua', 'Нікарагуа', 2],
    ['800', 'Uganda', 'Уганда', 2],
    ['008', 'Albania', 'Албанія', 1],
    ['051', 'Armenia', 'Вірменія', 1],
    ['196', 'Cyprus', 'Кіпр', 1],
    ['218', 'Ecuador', 'Еквадор', 1],
    ['268', 'Georgia', 'Грузія', 1],
    ['328', 'Guyana', 'Гаяна', 1],
    ['388', 'Jamaica', 'Ямайка', 1],
    ['400', 'Jordan', 'Йорданія', 1],
    ['398', 'Kazakhstan', 'Казахстан', 1],
    ['417', 'Kyrgyzstan', 'Киргизстан', 1],
    ['428', 'Latvia', 'Латвія', 1],
    ['450', 'Madagascar', 'Мадагаскар', 1],
    ['470', 'Malta', 'Мальта', 1],
    ['499', 'Montenegro', 'Чорногорія', 1],
    ['566', 'Nigeria', 'Нігерія', 1],
    ['512', 'Oman', 'Оман', 1],
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
  var RAMP = ['#4d3521', '#6f4b27', '#94632f', '#bb7f3d', '#de9f5c', '#f3c995'];

  var by = {}, total = 0;
  DATA.forEach(function (d) { by[d[0]] = d; total += d[3]; });

  function fill(v) {
    for (var i = 0; i < BREAKS.length; i++) if (v < BREAKS[i]) return RAMP[i];
    return RAMP[RAMP.length - 1];
  }
  function lang() { return (document.documentElement.getAttribute('lang') || '').indexOf('uk') === 0 ? 'ua' : 'en'; }
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
    new MutationObserver(renderTable).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
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
      /* Crimea is Ukraine. Natural Earth draws it inside Russia's outline, so
         move that polygon from Russia (643) to Ukraine (804) and merge the
         borders before drawing. */
      var geoms = world.objects.countries.geometries;
      var ru = geoms.filter(function (g) { return g.id === '643'; })[0];
      var ua = geoms.filter(function (g) { return g.id === '804'; })[0];
      var uaShape = null;
      if (ru && ua && ru.type === 'MultiPolygon') {
        for (var k = 0; k < ru.arcs.length; k++) {
          var c = d3.geoCentroid(topojson.feature(world, { type: 'Polygon', arcs: ru.arcs[k] }));
          if (c[0] > 32 && c[0] < 37 && c[1] > 44 && c[1] < 46.3) {
            var crimea = { type: 'Polygon', arcs: ru.arcs[k] };
            ru.arcs.splice(k, 1);
            uaShape = topojson.merge(world, [ua, crimea]);
            break;
          }
        }
      }
      var feats = topojson.feature(world, world.objects.countries).features
        .filter(function (f) { return f.id !== '010'; })                /* no Antarctica */
        .map(function (f) { return (f.id === '804' && uaShape) ? { type: 'Feature', id: f.id, properties: f.properties, geometry: uaShape } : f; });
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

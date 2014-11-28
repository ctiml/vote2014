$(document).ready(function() {
  var Timer = Timer || (function(){
    var _period = 1 * 30 * 1000;
    var _timer;
    var _is_running = false;
    var _callbacks = [];
    var _raise = function(){
      for (var i = 0; i < _callbacks.length; i++) {
        _callbacks[i]();
      }

      if (_is_running)
        _timer = setTimeout(_raise, _period);
    }
    var _start = function(){
      if (!_is_running) {
        _timer = setTimeout(_raise, _period);
        _is_running = true;
      }
    };
    var _stop = function(){
      _is_running = false;
      clearTimeout(_timer);
    };
    return {
      period: function(value){
        if (value != undefined && value != null && value === parseInt(value)) {
          _period = value;
          _stop();
          _start();
        }
        return _period;
      },
      start: _start,
      stop: _stop,
      register: function(callback){
        _callbacks.push(callback);
      }
    }
  })();

  var mapping = {};

  var WidgetManager = WidgetManager || (function() {
    var mWidgets = [];
    var saveToLocal = function() {
      if (localStorage) {
        localStorage.counties = JSON.stringify(mWidgets);
      }
    }
    var refresh = function() {
      $('.widget').each(function(i, w) {
        var wg = $(w);
        $.get('http://api.vote2014.g0v.ronny.tw/api/data/TC' + wg.data('code') + '000000', function(data) {
          $.each(data.rows, function(i, d) {
            var candidate = $(wg.find('.candidate[data-no="' + (i + 1) + '"]'));
            candidate.data('amount', d['候選人得票數']);
            candidate.find('.amount').text(d['候選人得票數']);
            candidate.find('.ratio').text(d['得票率'] + '%');
          });
          wg.find('.delivery .delivery-count').text(data['已送投開票所數'] + ' / ' + data['應送投開票所數']);
          var sorted_candidates = wg.find('.candidate').sort(function(a, b) {
            var a_amount = $(a).data('amount');
            var b_amount = $(b).data('amount');
            if (a_amount > b_amount) {
              return -1;
            } else if (a_amount < b_amount) {
              return 1;
            } else {
              return 0;
            }
          });
          wg.find('.candidate').detach();
          $.each(sorted_candidates, function(i, c) {
            wg.append(c);
          });
        });
      });
    }
    var render = function() {
      var container = $('#widget-container');
      container.children().remove();
      for (var i = 0; i < mWidgets.length; i++) {
        if (i  == 0) {
          container.append($('<div></div>').addClass('row widget-row'));
        }
        var row = $('.widget-row').last();
        //var col = $('<div></div>').addClass('col-md-4');
        var widget = $('<div></div>').attr('id', 'widget_' + mWidgets[i])
          .addClass('widget col-md-4').data('code', mWidgets[i]);
        //col.append(widget);
        row.append(widget);
      }
      $('.widget').each(function(i, w) {
        var wg = $(w);
        wg.append($('<div></div>').addClass('title').text(mapping[wg.data('code')]));
        var delivery = $('<div></div>').addClass('delivery');
        delivery.append($('<span></span>').text('開票所數：'));
        delivery.append($('<span></span>').addClass('delivery-count').text('0 / 0'));
        wg.append(delivery);
        $.get('http://api.vote2014.g0v.ronny.tw/api/candidate/TC' + wg.data('code') + '000000', function(res) {
          $.each(res, function(i, r) {
            var candidate = $('<div></div>').addClass('candidate');
            candidate.append($('<span></span>').addClass('no').text(r['號次'])).attr('data-no', r['號次']);
            candidate.append($('<span></span>').addClass('name').text(r['姓名']));
            candidate.append($('<span></span>').addClass('amount pull-right'));
            candidate.append($('<span></span>').addClass('ratio pull-right'));
            wg.append(candidate);
          });
        });
      });
      refresh();
      saveToLocal();
    }
    var add = function(id) {
      mWidgets.push(id);
      mWidgets = mWidgets.filter(onlyUnique);
      render();
    }
    var loadFromLocal = function() {
      if (localStorage) {
        if (localStorage.counties && Array.isArray(JSON.parse(localStorage.counties))) {
          var counties = JSON.parse(localStorage.counties);
          $.each(counties, function(i, county) {
            $('.county[data-code="' + county + '"]').addClass('active');
            add(county);
          });
        }
      }
    }
    var onlyUnique = function(value, index, self) { 
        return self.indexOf(value) === index;
    }
    return {
      add: function(id) {
        add(id);
      },
      remove: function(id) {
        var index = mWidgets.indexOf(id);
        if (index >= 0) {
          delete(mWidgets[index]);
          mWidgets = mWidgets.filter(function(value) {return typeof(value) !== "undefined" })
        }
        render();
      },
      refresh: function() {
        refresh();
      },
      load: function() {
        loadFromLocal();
      },
      ids: function() {
        console.log(mWidgets);
      }
    }
  })();

  $.get('http://api.vote2014.g0v.ronny.tw/api/county', function(res) {
    var ul = $('.county-template').parent();
    for (var i = 1; i < res.length; i++) {
      var li = $('.county-template').clone();
      li.removeClass('county-template');
      var code = res[i][0] + res[i][1];
      li.attr('data-code', code);
      li.find('a').text(res[i][2]);
      ul.append(li);
      mapping[code] = res[i][2];
    }
    $('.county').on('click', function(e) {
      e.stopPropagation();
      e.preventDefault();
      if ($(this).hasClass('active')) {
        $(this).removeClass('active');
        WidgetManager.remove($(this).data('code'));
      } else {
        $(this).addClass('active');
        WidgetManager.add($(this).data('code'));
      }
    });
    WidgetManager.load();
    Timer.register(WidgetManager.refresh);
    Timer.start();
  });

  window.WidgetManager = WidgetManager;
});

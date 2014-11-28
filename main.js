$(document).ready(function() {
  var Timer = Timer || (function(){
    var _period = 1 * 10 * 1000;
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
    var refresh = function() {
      $('.widget').each(function(i, w) {
        var wg = $(w);
        $.get('http://api.vote2014.g0v.ronny.tw/api/data/TC' + wg.data('code') + '000000', function(data) {
          $.each(data.rows, function(i, d) {
            var candidate = $(wg.find('.candidate')[i]);
            candidate.find('.amount').text(d['候選人得票數']);
            candidate.find('.ratio').text(d['得票率'] + '%');
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
        $.get('http://api.vote2014.g0v.ronny.tw/api/candidate/TC' + wg.data('code') + '000000', function(res) {
          $.each(res, function(i, r) {
            var candidate = $('<div></div>').addClass('candidate');
            candidate.append($('<span></span>').addClass('no').text(r['號次']));
            candidate.append($('<span></span>').addClass('name').text(r['姓名']));
            candidate.append($('<span></span>').addClass('amount pull-right'));
            candidate.append($('<span></span>').addClass('ratio pull-right'));
            wg.append(candidate);
          });
        });
      });
      refresh();
    }
    var onlyUnique = function(value, index, self) { 
        return self.indexOf(value) === index;
    }
    return {
      add: function(id, name) {
        mWidgets.push(id);
        mWidgets = mWidgets.filter(onlyUnique);
        render();
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
      li.find('a').data('code', code).text(res[i][2]);
      ul.append(li);
      mapping[code] = res[i][2];
    }
    $('.county').on('click', function(e) {
      e.stopPropagation();
      e.preventDefault();
      if ($(this).hasClass('active')) {
        $(this).removeClass('active');
        WidgetManager.remove($(this).find('a').data('code'));
      } else {
        $(this).addClass('active');
        WidgetManager.add($(this).find('a').data('code'));
      }
    });
  });

  Timer.register(WidgetManager.refresh);
  Timer.start();
  window.WidgetManager = WidgetManager;
});

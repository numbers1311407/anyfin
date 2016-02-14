;(function (root) {
  var app = root.app = angular.module("anyfin", ["nvd3"]);

  app.controller('IndexCtrl', ['$scope', function (scope) {
    scope.opponent = {
      wl: 0,
      go: 0,
      other: 0
    };

    scope.incrOpponentWl = function () {
      scope.opponent.wl = scope.opponent.wl + 1;
      scope.update();
    };
    scope.decrOpponentWl = function () {
      scope.opponent.wl = Math.max(scope.opponent.wl - 1, 0);
      scope.update();
    };
    scope.incrOpponentGo = function () {
      scope.opponent.go = scope.opponent.go + 1;
      scope.update();
    };
    scope.decrOpponentGo = function () {
      scope.opponent.go = Math.max(scope.opponent.go - 1, 0);
      scope.update();
    };
    scope.incrOpponentMurlocs = function () {
      scope.opponent.other = scope.opponent.other + 1;
      scope.update();
    };
    scope.decrOpponentMurlocs = function () {
      scope.opponent.other = Math.max(scope.opponent.other - 1, 0);
      scope.update();
    };

    scope.board = {
      slot0: '',
      slot1: '',
      slot2: '',
      slot3: '',
      slot4: '',
      slot5: '',
      slot6: ''
    };

    scope.onBoard = function () {
      var board = [];
      for (var i=0, v; i<7; i++) {
        v = scope.board['slot'+i];
        if (v && '-' !== v) { board.push(v); }
      }
      return board;
    };

    scope.free = function () {
      var free = 7;
      for (var i=0; i<7; i++) {
        if (scope.board['slot'+i]) free--;
      }
      return free;
    };

    scope.sets = [];
    scope.combinations = 0;

    var sum = scope.sum = function (arr, prop) {
      return _.reduce(arr, function (mem, o) {
        return mem + o[prop];
      }, 0);
    };


    scope.buildSet = function (onboard, gySet, wl, go, total) {
      var set = { };

      var toMurloc = function (id, i, list) {
        var m = new Murloc(scope.murlocs[id]);
        m.attack = m.attack(list.onboard, wl, go, total);
        return m;
      };

      _.each(onboard.concat(gySet), function count(id) {
        if ('1' == id) go += 1;
        else if ('3' == id) wl += 1;
        total += 1;
      });

      onboard.onboard = true;

      set.onboard = _.map(onboard, toMurloc);
      set.onboard.damage = sum(set.onboard, 'attack');

      set.graveyard = _.map(gySet, toMurloc);
      set.graveyard.damage = sum(set.graveyard, 'attack');

      set.damage = set.onboard.damage + set.graveyard.damage;

      return set;
    };

    scope.graphOptions = {
      chart: {
        type: 'pieChart',
        height: 400,
        donut: true,
        x: function(d){return d.key;},
        y: function(d){return d.y;},
        showLabels: true,
        showLegend: false,
        pie: {
          startAngle: function(d) { return d.startAngle/2 -Math.PI/2 },
          endAngle: function(d) { return d.endAngle/2 -Math.PI/2 }
        },
        duration: 500,
        tooltip: {
          keyFormatter: function (d, i) {
            return d + ' Damage - ';
          },
          valueFormatter: function (d, i) {
            return d;
          }
        },
        legend: {
          margin: {
            top: 5,
            right: 140,
            bottom: 5,
            left: 0
          }
        }
      }
    };

    scope.update = function () {
      var free = scope.free();
      var gySets = root.helpers.getSubsets(scope.graveyard, free);
      var onboard = scope.onBoard();
      var t = scope.opponent.other + scope.opponent.wl + scope.opponent.go;
      var go = scope.opponent.go;
      var wl = scope.opponent.wl;

      scope.sets = []
      scope.combinations = gySets.length;

      if (gySets.length) {
        for (var i=0; i<gySets.length; i++) {
          scope.sets.push(scope.buildSet(onboard, gySets[i], wl, go, t))
        }
      } else {
        scope.sets.push(scope.buildSet(onboard, [], wl, go, t));
      }

      scope.sets.sort(function (a, b) {
        return a.damage - b.damage;
      });

      scope.sets.min = scope.sets[0];
      scope.sets.max = scope.sets[scope.sets.length - 1];
      scope.sets.avg = sum(scope.sets, 'damage') / scope.sets.length;


      var data = _.reduce(scope.sets, function (buckets, set) {
        buckets[set.damage] || (buckets[set.damage] = 0);
        buckets[set.damage] += 1;
        return buckets;
      }, {});

      scope.graphData = _.map(data, function (val, key) {
        return { key: key, y: val };
      });

      console.log(scope.graphData);
    };

    function Murloc (attrs) {
      for (var attr in attrs) {
        if (attrs.hasOwnProperty(attr)) {
          this[attr] = attrs[attr];
        }
      }
    }

    var attack = Murloc.prototype.attack = function (onboard, wl, go, total) {
      if (!onboard && !this.charge) return 0;
      return this.power + (2 * wl) + go;
    };

    scope.murlocs = {
      0: {
        name: "Finley",
        power: 1
      },
      1: { 
        name: "Oracle",
        power: 1,
        attack: function (onboard, wl, go, total) {
          return attack.call(this, onboard, wl, go - 1, total);
        }
      },
      2: { 
        name: "Bluegill",
        charge: true,
        power: 2
      },
      3: {
        name: "Warleader",
        power: 3,
        attack: function (onboard, wl, go, total) {
          return attack.call(this, onboard, wl - 1, go, total);
        }
      },
      4: {
        name: "Murkeye",
        charge: true,
        power: 2,
        attack: function (onboard, wl, go, total) {
          return attack.call(this, onboard, wl, go, total) + total - 1;
        }
      },
      5: {
        name: "Other Murloc"
      }
    };

    scope.boardOptions = angular.copy(scope.murlocs);
    delete scope.boardOptions['5'];
    scope.boardOptions['-'] = {
      name: "* Non Murloc"
    };

    scope.graveyardOptions = angular.copy(scope.murlocs);

    scope.graveyard = [];

    scope.onGraveyardItemChange = function () {
      scope.graveyard.push(scope.selectedGraveyardItem);
      scope.selectedGraveyardItem = '';
      scope.update();
    };

    scope.removeFromGraveyard = function (i) {
      scope.graveyard.splice(i, 1);
      scope.update();
    };
  }]);


  root.helpers = {};

  root.helpers.getSubsets = (function () {
    var fn = function(n, src, got, all) {
      if (n == 0) {
        if (got.length > 0) {
          all[all.length] = got;
        }
        return;
      }
      for (var j = 0; j < src.length; j++) {
        fn(n - 1, src.slice(j + 1), got.concat([src[j]]), all);
      }
      return;
    }

    return function (a, count) {
      var all = []
      if (count > a.length) count = a.length;
      fn(count, a, [], all);
      return all;
    }
  })();

})(window.root || (window.root = {}));

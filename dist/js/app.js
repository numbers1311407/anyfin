;(function (root) {
  var app = root.app = angular.module("anyfin", ["nvd3"]);

  app.controller('IndexCtrl', ['$scope', function (scope) {

    scope.combinationCap = root.helpers.combinationCap;

    function Murloc (attrs) {
      for (var attr in attrs) {
        if (attrs.hasOwnProperty(attr)) {
          this[attr] = attrs[attr];
        }
      }
    }

    var attack = 
      Murloc.prototype.attack = function (onboard, wl, go, total, summoned) {
        if (!onboard && !this.charge) return 0;
        return this.power + (2 * wl) + go;
      };

    scope.murlocs = {
      t: { 
        name: "Murloc Tidecaller",
        power: 1,
        deckImg: '/assets/images/bars/murloc-tidecaller.png',
        cardImg: '/assets/images/cards/tidecaller.png',
        attack: function (onboard, wl, go, total, summoned) {
          var retv = attack.call(this, onboard, wl, go);
          return retv ? retv + summoned : retv;
        }
      },
      g: { 
        name: "Grimscale Oracle",
        power: 1,
        deckImg: '/assets/images/bars/grimscale-oracle.png',
        cardImg: '/assets/images/cards/oracle.png',
        attack: function (onboard, wl, go) {
          return attack.call(this, onboard, wl, go - 1);
        }
      },
      b: { 
        name: "Bluegill Warrior",
        charge: true,
        power: 2,
        deckImg: '/assets/images/bars/bluegill-warrior.png',
        cardImg: '/assets/images/cards/bluegill.png'
      },
      w: {
        name: "Murloc Warleader",
        power: 3,
        deckImg: '/assets/images/bars/murloc-warleader.png',
        cardImg: '/assets/images/cards/warleader.png',
        attack: function (onboard, wl, go) {
          return attack.call(this, onboard, wl - 1, go);
        }
      },
      m: {
        name: "Old Murk-Eye",
        charge: true,
        power: 2,
        deckImg: '/assets/images/bars/old-murk-eye.png',
        cardImg: '/assets/images/cards/murkeye.png',
        attack: function (onboard, wl, go, total) {
          return attack.call(this, onboard, wl, go, total) + total - 1;
        }
      },
      o: {
        name: "Other Murloc",
        deckImg: '/assets/images/bars/murloc-tinyfin.png',
        cardImg: '/assets/images/cards/tinyfin.png',
        power: 1
      }
    };

    scope.update = function () {
      var free = scope.free();
      var gy = _.reduce(scope.graveyard, function (o, val, key) {
        // there's no reason to calculate past the # of free spaces
        if (val > free) val = free;
        for (var i=0; i<val; i++) {
          o.push(key);
        };
        return o;
      }, []);

      var gySets = root.helpers.combinations(gy, free);

      scope.limitReached = gySets.exception ? true : false;

      scope.totalCombinations = gySets.length;

      gySets = _.values(_.reduce(gySets, function (o, arr) {
        var key = arr.sort().join('');
        o[key] = arr;
        return o;
      }, {}));

      scope.combinations = gySets.length;

      var onboard = _.reject(scope.board, function (minion) {
        return !minion.murloc;
      });
      var t = scope.opponent.o + scope.opponent.w + scope.opponent.g;
      var go = scope.opponent.g;
      var wl = scope.opponent.w;

      // min and max are tracked as the set is iterated to avoid having to
      // sort afterwards
      var min;
      var max;

      scope.sets = []

      if (gySets.length) {
        for (var i=0, set; i<gySets.length; i++) {
          set = scope.buildSet(onboard, gySets[i], wl, go, t);
          if (!max || set.damage > max.damage) max = set;
          if (!min || set.damage < min.damage) min = set;
          scope.sets.push(set);
        }
      } else if (onboard.length) {
        scope.sets.push(scope.buildSet(onboard, [], wl, go, t));
      }

      scope.sets.min = min || scope.sets[0];
      scope.sets.max = max || scope.sets[0];

      var avg = scope.sets.avg = scope.sets.length
        ? sum(scope.sets, 'damage') / scope.sets.length
        : 0;

      if (scope.sets.length > 1) {
        var n = _.chain(scope.sets)
          .map(function (set) {
            return Math.pow(set.damage - avg, 2);
          })
          .reduce(function (sum, sqv) {
            return sum + sqv;
          }, 0)
          .value();

        scope.sets.variance = n / scope.sets.length - 1;
        scope.sets.sd = Math.sqrt(scope.sets.variance);
      }

      // Graph Data
      // ---
      // var data = _.reduce(scope.sets, function (buckets, set) {
      //   buckets[set.damage] || (buckets[set.damage] = 0);
      //   buckets[set.damage] += 1;
      //   return buckets;
      // }, {});

      // scope.graphData = _.map(data, function (val, key) {
      //   return { key: key, y: val };
      // });
    };

    scope.opponent = {
      w: 0,
      g: 0,
      o: 0
    };

    scope.opponentDirty = function () {
      return scope.opponent.w || scope.opponent.g || scope.opponent.o;
    };

    scope.clearOpponent = function () {
      scope.opponent.w = scope.opponent.g = scope.opponent.o = 0;
    };

    scope.$watchGroup([
      'opponent.w', 
      'opponent.g', 
      'opponent.o'
    ], scope.update);

    scope.board = [];

    scope.$watchCollection('board', scope.update);

    scope.onBoard = function () {
      return _.pluck(scope.board, 'murloc');
    };

    scope.free = function () {
      return 7 - scope.board.length;
    };

    scope.addToBoard = function (card) {
      if (scope.free()) {
        scope.board.push( angular.copy(card) );
      }
    };

    scope.removeFromBoard = function (i) {
      scope.board.splice(i, 1);
    };

    scope.clearBoard = function () {
      scope.board = [];
    };

    scope.deckOptions = {
      murlocs: scope.murlocs,
      cards: [
        { murloc: 'b' },
        { murloc: 'w' },
        { murloc: 'm' },
        { murloc: 'g' },
        { murloc: 't' },
        { murloc: 'o' },
        { name: 'Other Minion', 
          deckImg: '/assets/images/bars/recruit.png',
          cardImg: '/assets/images/cards/recruit.png'
        }
      ],
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
        var power, m;
        // account for board murlocs, replacing obj with id and noting
        // the updated power
        if (id.murloc) {
          power = id.power;
          id = id.murloc;
        }
        m = new Murloc(scope.murlocs[id]);
        // if power was passed, overwrite it on the murloc obj
        if ('undefined' !== typeof power) {
          m.power = power;
        }
        // then overwrite the attack function with an attack value
        // calculated from the current state
        m.attack = m.attack(list.onboard, wl, go, total, gySet.length);

        return m;
      };

      _.each(onboard.concat(gySet), function count(id) {
        // again, account for board murloc objects vs ids
        if (id.murloc) id = id.murloc;
        // if it's an oracle, increment total oracles
        if ('g' == id) go += 1;
        // if it's a warleader, incrememt warleaders
        else if ('w' == id) wl += 1;
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

    scope.graveyard = {
      m: 0,
      b: 0,
      w: 0,
      g: 0,
      o: 0
    };

    scope.$watchGroup([
      'graveyard.m', 
      'graveyard.b', 
      'graveyard.w',
      'graveyard.g', 
      'graveyard.o'
    ], scope.update);

    scope.graveyardDirty = function () {
      return scope.graveyard.m
          || scope.graveyard.b
          || scope.graveyard.w
          || scope.graveyard.g
          || scope.graveyard.o;
    };

    scope.clearGraveyard = function () {
      scope.graveyard.m = 
      scope.graveyard.b =
      scope.graveyard.w =
      scope.graveyard.g = 
      scope.graveyard.o = 0;
    };
  }]);

  app.directive('deck', [function () {
    return {
      restrict: 'E',
      scope: {
        onClear: '=',
        onSelect: '=',
        options: '=',
        board: '='
      },

      link: function (scope, elem, attrs) {
        scope.cards = angular.copy(scope.options.cards);

        _.each(scope.cards, function (card) {
          var murloc = card.murloc && scope.options.murlocs[card.murloc];
          if (murloc) {
            card.defaultPower = card.power = murloc.power;
            card.name = murloc.name;
            card.deckImg = murloc.deckImg;
            card.cardImg = murloc.cardImg;
          } else {
            card.power = 0;
          }
        });
      },

      template:
          '<div class="btn-group">'
        +   '<a ng-if="board.length" class="btn btn-default" ng-click="onClear()">Clear</a>'
        +   '<div class="deck">'
        +     '<button data-toggle="dropdown" type="button" class="dropdown-toggle btn btn-default" ng-disabled="disabled">'
        +       'Add a minion <span class="caret"></span>'
        +     '</button>'
        +     '<ul class="dropdown-menu" role="menu">'
        +       '<li class="deck-slot" ng-repeat="card in cards">'
        +         '<a ng-click="onSelect(card)" style="background-image: url({{card.deckImg}});">'
        +           '<span class="deck-slot-wrapper"><span>{{card.name}}</span></span>'
        +         '</a>'
        +       '</li>'
        +     '</ul>'
        +   '</div>'
        + '</div>'

    }
  }]);

  root.helpers = {};
  root.helpers.combinationCap = 25000;

  root.helpers.combinations = (function () {
    var fn = function(n, src, got, all) {
      if (n == 0) {
        if (got.length > 0) {
          all[all.length] = got;
        }
        return;
      }
      for (var j = 0; j < src.length; j++) {
        fn(n - 1, src.slice(j + 1), got.concat([src[j]]), all);
        if (all.length >= root.helpers.combinationCap) {
          throw "Subset calculation cap reached";
        }
      }
      return;
    }

    return function (a, count) {
      var all = [], retv;

      if (count > a.length) {
        count = a.length;
      }

      try {
        fn(count, a, [], all);
      } catch (e) {
        all.exception = e;
      }

      return all;
    }
  })();



})(window.root || (window.root = {}));

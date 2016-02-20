;(function (root) {
  var app = root.app = angular.module("anyfin", ["nvd3"]);

  app.controller('IndexCtrl', ['$scope', function (scope) {
    scope.combinationLimit = 60000;

    scope.murlocs = root.Murloc.murlocs;

    //
    // Board
    //
    
    scope.board = [];

    scope.onBoard = function () {
      return _.pluck(scope.board, 'murloc');
    };

    scope.boardDirty = function () {
      return !!scope.board.length;
    };

    scope.addToBoard = function (card) {
      if (state.free()) {
        scope.board.push( angular.copy(card) );
      }
    };

    scope.removeFromBoard = function (i) {
      scope.board.splice(i, 1);
    };

    scope.clearBoard = function () {
      scope.board = [];
    };

    scope.incrPower = function (index) {
      if (!scope.board[index]) return;
      scope.board[index].power += 1;
      scope.state.set({board: scope.board});
    };

    scope.decrPower = function (index) {
      if (!scope.board[index]) return;
      scope.board[index].power = Math.max(scope.board[index].power - 1, 0);
      scope.state.set({board: scope.board});
    };


    //
    // Opponent
    //

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


    //
    // Graveyard
    //

    scope.graveyard = {
      b: 0,
      g: 0,
      m: 0,
      o: 0,
      w: 0
    };

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


    //
    // Combined
    //

    scope.dirty = function () {
      return scope.opponentDirty() 
        || scope.boardDirty() 
        || scope.graveyardDirty();
    };

    scope.clear = function () {
      scope.clearOpponent();
      scope.clearBoard();
      scope.clearGraveyard();
    };

    // stick the state on the window for easy debugging
    window.state = scope.state = new root.State({
      board: scope.board,
      graveyard: scope.graveyard,
      opponent: scope.opponent
    }, {
      combinationLimit: scope.combinationLimit
    });

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
          deckImg: 'assets/images/bars/recruit.png',
          cardImg: 'assets/images/cards/recruit.png'
        }
      ],
    };

    scope.graphOptions = {
      chart: {
        type: 'lineChart',
        height: 200,
        showLegend: false,
        x: function(d){ return d.x; },
        y: function(d){ return d.y; },
        useInteractiveGuideline: true,
        forceY: [0, 1],
        xAxis: {
          axisLabel: 'Damage',
          tickFormat: function (d) {
            return d;
          }
        },
        yAxis: {
          axisLabel: 'Probability',
          tickFormat: function(d) {
            return d3.format('.1%')(d);
          },
          axisLabelDistance: 0
        }
      }
    };

    scope.$watchGroup([
      'opponent.w', 
      'opponent.g', 
      'opponent.o'
    ], function (is, was) {
      if (angular.equals(is, was)) return;
      scope.state.set({opponent: scope.opponent});
    });

    scope.$watchCollection('board', function (is, was) {
      if (angular.equals(is, was)) return;
      scope.state.set({board: scope.board});
    });

    scope.$watchGroup([
      'graveyard.m', 
      'graveyard.b', 
      'graveyard.w',
      'graveyard.g', 
      'graveyard.o'
    ], function (is, was) {
      if (angular.equals(is, was)) return;
      scope.state.set({graveyard: scope.graveyard});
    });
  }]);


  app.directive('murlocCounters', [function () {
    return {
      restrict: 'A',
      scope: {
        model: '=murlocCounters',
        options: '='
      },

      link: function (scope, elem, attrs) {
        var options = scope.options || {};
        scope.max = options.max || 8;
        scope.imageSrc = function (id) {
          return root.Murloc.murlocs[id].cardImg;
        }
        scope.name = function (id) {
          return root.Murloc.murlocs[id].name;
        }
        scope.incr = function (id) {
          scope.model[id] += 1;
        }
        scope.decr = function (id) {
          scope.model[id] = Math.max(scope.model[id]-1, 0);
        }
      },

      template:
          '<li ng-repeat="(id, value) in model" class="card-minion" title="{{name(id)}}">'
        +   '<label class="card-minion-name">{{name(id)}}</label>'
        +   '<img ng-click="incr(id)" ng-right-click="decr(id)" ng-src="{{imageSrc(id)}}">'
        +   '<p class="card-minion-bar">'
        +     '<i class="fa fa-arrow-down" ng-click="decr(id)"></i>'
        +     '<span class="badge card-minion-badge card-minion-count" ng-bind="model[id]"></span>'
        +     '<i class="fa fa-arrow-up" ng-click="incr(id)"></i>'
        +   '</p>'
        +   '<label class="card-minion-label">Count</label>'
        + '</li>'
    };
  }]);

  app.directive('deckSelect', [function () {
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
          '<div>'
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

  app.directive('ngRightClick', function ($parse) {
    return function(scope, element, attrs) {
      var fn = $parse(attrs.ngRightClick);

      element.bind('contextmenu', function (event) {
        scope.$apply(function () {
          event.preventDefault();
          fn(scope, {$event: event});
        });
      });
    };
  });

})(window.root || (window.root = {}));

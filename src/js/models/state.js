;(function (root) {
  root.State = State;

  function State (obj, options) {
    this.options = options || {};
    this.combinations = root.helpers.combinator(options.combinationLimit);
    this.set(obj);
  }

  State.prototype.free = function () {
    return 7 - (this.board ? this.board.length : 0);
  };

  State.prototype.ready = function () {
    return !!this.graveyard && !!this.board && !!this.opponent;
  };

  State.prototype.prepare = function () {
    if (this.ready()) {
      this.prepareSets();
      this.prepareMetrics();
      this.prepareGraphData();
    }
  };

  State.prototype.set = function (obj) {
    obj = _.pick(obj, 'graveyard', 'board', 'opponent');

    var free = this.free();

    obj.opponent  && this.setOpponent(obj.opponent);
    obj.board     && this.setBoard(obj.board);

    if (obj.graveyard) {
      this.setGraveyard(obj.graveyard);
    } 
    // clunky, but refresh the graveyard if the free slot count has changed
    else if (this.free() !== free) {
      this.setGraveyard(this.graveyard);
    }

    this.prepare();
  };

  State.prototype.setOpponent = function (opponent) {
    this.opponent = angular.copy(opponent);
  };

  State.prototype.setBoard = function (board) {
    this.board = angular.copy(board);
  };

  State.prototype.setGraveyard = function (graveyard) {
    this.graveyard = angular.copy(graveyard);
    this._graveyard = {};

    this._graveyard.list = _.reduce(this.graveyard, function (o, val, key) {
      for (var i=0; i<val; i++) { o.push(key); };
      return o;
    }, []);

    this._graveyard.combos = 
      this.combinations(this._graveyard.list, this.free());

    this._graveyard.summoned = 
      this._graveyard.combos[0] ? this._graveyard.combos[0].length : 0;

    this._graveyard.data = 
      _.reduce(this._graveyard.combos, function (o, arr) {
        var key = arr.join('');
        o[key] || (o[key] = {count: 0});
        o[key].count += 1;
        o[key].set = arr;
        return o;
      }, {});
  };

  /**
   * param [Object] onboard - an array of murloc data objects representing the board
   * param Object combo - data about a particular graveyard summon combo
   * @api private
   */
  State.prototype.addSet = function (onboard, combo) {
    var set = {};
    var state = this;

    // start building the murloc board state data.  It begins with just the 
    // opponents murlocs, and is build up as sets are added.  This is passed
    // along to each murloc to determine their damage
    var murlocs = {
      summoned: this._graveyard.summoned,
      total: this.opponent.o + this.opponent.w + this.opponent.g,
      g: this.opponent.g,
      w: this.opponent.w
    };

    _.each(onboard.concat(combo.set || []), function count(id) {
      // again, account for board murloc objects vs ids
      if (id.murloc) id = id.murloc;

      // if it's an oracle, increment total oracles
      if ('g' == id) murlocs.g += 1;
      // if it's a warleader, incrememt warleaders
      else if ('w' == id) murlocs.w += 1;

      // then increment the total
      murlocs.total += 1
    });

    var toMurloc = function (id, i, list) {
      var power, m, onboard = false;
      // Account for board murlocs, replacing obj with id and noting
      // the updated power
      if (id.murloc) {
        // The combo.set, which is also passed through this function, is just
        // an array of letter IDs, so if id.murloc is a property, this minion
        // is "onboard".  This is passed to the attack function to designate
        // primarily that the murloc doesn't need charge to do damage.
        onboard = true;
        power = id.power;
        id = id.murloc;
      }
      m = new root.Murloc(id);

      // if power was found, overwrite it on the murloc obj
      if ('undefined' !== typeof power) {
        m.power = power;
      }
      // then overwrite the attack function with an attack value
      // calculated from the current state
      m.attack = m.attack(onboard, angular.copy(murlocs));

      return m;
    };

    set.onboard = _.map(onboard, toMurloc);
    set.onboard.damage = root.helpers.sum(set.onboard, 'attack');

    set.graveyard = _.map(combo.set, toMurloc);
    set.graveyard.damage = root.helpers.sum(set.graveyard, 'attack');

    set.damage = set.onboard.damage + set.graveyard.damage;

    if (combo.count) {
      set.count = combo.count;
    }

    this.sets.push(set);
  };

  State.prototype.prepareSets = function () {
    this.sets = [];

    var onboard = _.reject(this.board, function (minion) {
      return !minion.murloc;
    });

    if (this._graveyard.combos.length) {
      _.each(this._graveyard.data, function (data, key) {
        this.addSet(onboard, data);
      }, this);
    } 
    else if (onboard.length) {
      this.addSet(onboard, {});
    }

    this.sets.sort(function (a, b) {
      return a.damage - b.damage;
    });

    this.sets.min = this.sets[0];
    this.sets.max = this.sets[this.sets.length-1];
    this.sets.total = this._graveyard.combos.length || 1;

    this.sets.grouped = _.reduce(this.sets, function (o, set) {
      o[set.damage] || (o[set.damage] = {count: 0, set: []});
      o[set.damage].set.push(set);
      o[set.damage].count += set.count;
      return o;
    }, {});
  };

  State.prototype.prepareMetrics = function () {
    this.metrics = {};

    this.metrics.min = this.sets.min ? this.sets.min.damage : 0;
    this.metrics.max = this.sets.max ? this.sets.max.damage : 0;
      
    if (this.sets.length > 1 && this.metrics.max > 0) {
      this.metrics.sum = _.reduce(this.sets, function (sum, set) {
        return sum + set.count * set.damage;
      }, 0);

      // actually calcualte the average (which was preset to 0)
      this.metrics.avg = this.metrics.sum / this.sets.total;

      this.metrics.variance = _.chain(this.sets)
        .map(function (set) {
          return Math.pow(set.damage - this.metrics.avg, 2);
        }, this)
        .reduce(function (sum, sqv) {
          return sum + sqv;
        }, 0)
        .value() / this.sets.length - 1;

      this.metrics.sd = Math.sqrt(this.metrics.variance);

      var tCombos = rCombos = this.sets.total;
      this.metrics.probabilities = 
        _.reduce(this.sets.grouped, function (o, data, score) {
          o[score] = rCombos/tCombos;
          rCombos -= data.count;
          return o;
        }, {});
    }
    else {
      this.metrics.avg = this.metrics.min;
    }
  };

  State.prototype.prepareGraphData = function () {
    if (!this.metrics.probabilities) {
      this.graphData = [];
      return;
    }

    var range = _.range(this.metrics.min, this.metrics.max+1).reverse();
    var runningProbability;
    var probabilities = this.metrics.probabilities;

    var points = _.map(range, function (score) {
      if (probabilities[score]) {
        runningProbability = probabilities[score];
      }
      return {
        x: score,
        y: runningProbability
      }
    });

    this.graphData = [{ key: "Probability", values: points.reverse() }];
  };

})(window.root || (window.root = {}));

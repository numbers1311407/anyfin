;(function (root) {
  root.Murloc = Murloc;

  function Murloc (attrs) {
    if ('string' === typeof attrs) {
      attrs = Murloc.murlocs[attrs];
    }

    for (var attr in attrs) {
      if (attrs.hasOwnProperty(attr)) {
        this[attr] = attrs[attr];
      }
    }
  }

  var attack = 
    Murloc.prototype.attack = function (onboard, data) {
      if (!onboard && !this.charge) return 0;
      return this.power + (2 * data.w) + data.g;
    };

  Murloc.murlocs = {
    t: { 
      name: "Murloc Tidecaller",
      power: 1,
      deckImg: 'assets/images/bars/murloc-tidecaller.png',
      cardImg: 'assets/images/cards/tidecaller.png',
      attack: function (onboard, data) {
        var retv = attack.call(this, onboard, data);
        return onboard ? retv + data.summoned : retv;
      }
    },
    g: { 
      name: "Grimscale Oracle",
      power: 1,
      deckImg: 'assets/images/bars/grimscale-oracle.png',
      cardImg: 'assets/images/cards/oracle.png',
      attack: function (onboard, data) {
        data.g -= 1;
        return attack.call(this, onboard, data);
      }
    },
    b: { 
      name: "Bluegill Warrior",
      charge: true,
      power: 2,
      deckImg: 'assets/images/bars/bluegill-warrior.png',
      cardImg: 'assets/images/cards/bluegill.png'
    },
    w: {
      name: "Murloc Warleader",
      power: 3,
      deckImg: 'assets/images/bars/murloc-warleader.png',
      cardImg: 'assets/images/cards/warleader.png',
      attack: function (onboard, data) {
        data.w -= 1;
        return attack.call(this, onboard, data);
      }
    },
    m: {
      name: "Old Murk-Eye",
      charge: true,
      power: 2,
      deckImg: 'assets/images/bars/old-murk-eye.png',
      cardImg: 'assets/images/cards/murkeye.png',
      attack: function (onboard, data) {
        return attack.call(this, onboard, data) + data.total - 1;
      }
    },
    o: {
      name: "Other Murloc",
      deckImg: 'assets/images/bars/murloc-tinyfin.png',
      cardImg: 'assets/images/cards/tinyfin.png',
      power: 1
    }
  };

})(window.root || (window.root = {}));

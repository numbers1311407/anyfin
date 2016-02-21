;(function (root) {
  root.helpers = {};

  root.helpers.combinator = function (limit) {
    return function pick (set, k) {
      var i, j, combs, head, tailcombs;

      if (!set.length) {
        return [];
      }
    
      if (!k || k >=set.length) {
        return [set];
      }

      combs = [];
      
      if (k == 1) {
        for (i = 0; i < set.length; i++) {
          combs.push([set[i]]);
          if (combs.length == limit) break;
        }
        return combs;
      }
      
      for (i = 0; i < set.length - k + 1; i++) {
        head = set.slice(i, i+1);
        tailcombs = pick(set.slice(i + 1), k - 1);
        for (j = 0; j < tailcombs.length; j++) {
          combs.push(head.concat(tailcombs[j]));
          if (combs.length == limit) {
            i = set.length - k + 1;
            break;
          }
        }
      }

      return combs;
    }
  };

  root.helpers.sum = function (arr, prop) {
    return _.reduce(arr, function (mem, o) {
      return mem + o[prop];
    }, 0);
  };


  root.helpers.bm = (function () {
    var time, marks;

    function start () {
      time = Date.now();
      marks = [];
    }

    function mark (message) {
      marks.push({ m: message, t: Date.now() });
    };

    function finish (showTime) {
      var split;

      console.log('bm results\n--------\nstart');

      _.each(marks, function (mark, i) {
        split = mark.t - (i ? marks[i-1].t : time);
        console.log(i+':', split, mark.m || '', showTime ? mark.t : '');
      });

      console.log('total: '+(Date.now() - time)+'ms\n--------');
    }

    start();

    return {
      start: start,
      mark: mark,
      finish: finish
    }
  })();

})(window.root || (window.root = {}));

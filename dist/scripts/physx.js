(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _src = require('./src');

Object.keys(_src).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _src[key];
    }
  });
});

},{"./src":5}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * An AnimationJob is used with the animator controller to update and re-draw something each frame.
 *
 * @abstract
 */
var AnimationJob = function () {
  /**
   * @param {Function} [onComplete] A callback to be called when this AnimationJob is finished.
   */
  function AnimationJob(onComplete) {
    _classCallCheck(this, AnimationJob);

    // AnimationJob is an abstract class. It should not be instantiated directly.
    if (new.target === AnimationJob) {
      throw new TypeError('Cannot construct AnimationJob instances directly');
    }

    this._startTime = 0;
    this._isComplete = true;
    this._onComplete = onComplete;
  }

  /**
   * Indicates whether this AnimationJob is complete.
   *
   * @return {boolean}
   */


  _createClass(AnimationJob, [{
    key: 'start',


    /**
     * Sets this AnimationJob as started.
     *
     * @param {DOMHighResTimeStamp} startTime
     */
    value: function start(startTime) {
      this._startTime = startTime;
      this._isComplete = false;
    }

    /**
     * Updates the animation progress of this AnimationJob to match the given time.
     *
     * This is called from the overall animation loop.
     *
     * @param {DOMHighResTimeStamp} currentTime
     * @param {DOMHighResTimeStamp} deltaTime
     * @abstract
     */

  }, {
    key: 'update',
    value: function update(currentTime, deltaTime) {
      // Extending classes should implement this method.
      throw new TypeError('Method not implemented');
    }

    /**
     * Draws the current state of this AnimationJob.
     *
     * This is called from the overall animation loop.
     *
     * @abstract
     */

  }, {
    key: 'draw',
    value: function draw() {
      // Extending classes should implement this method.
      throw new TypeError('Method not implemented');
    }

    /**
     * Handles any necessary state for this AnimationJob being finished.
     *
     * @param {boolean} isCancelled
     */

  }, {
    key: 'finish',
    value: function finish(isCancelled) {
      console.log(this.constructor.name + ' ' + (isCancelled ? 'cancelled' : 'completed'));

      this._isComplete = true;

      if (this._onComplete) {
        this._onComplete();
      }
    }
  }, {
    key: 'isComplete',
    get: function get() {
      return this._isComplete;
    }
  }]);

  return AnimationJob;
}();

exports.AnimationJob = AnimationJob;

},{}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.animator = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _frameLatencyProfiler = require('./frame-latency-profiler');

var _persistentAnimationJob = require('./persistent-animation-job');

var _transientAnimationJob = require('./transient-animation-job');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _DELTA_TIME_UPPER_THRESHOLD = 200;
var _FRAME_DURATION_WARNING_THRESHOLD = 1000 / 30;
var _FRAME_LATENCY_LOG_PERIOD = 5000;
var _LATENCY_LOG_LABEL = 'Animation frame period';

/**
 * This class handles the animation loop.
 *
 * This class's responsibilities include:
 * - updating modules for the current frame,
 * - drawing renderables for the current frame,
 * - starting and stopping transient animation jobs,
 * - capping time step durations at a max threshold.
 */

var Animator = function () {
  function Animator() {
    _classCallCheck(this, Animator);

    this._jobs = [];
    this._previousTime = null;
    this._isPaused = true;
    this._requestAnimationFrameId = null;
    this._totalUnpausedRunTime = 0;
    this._lastUnpauseTime = null;
    this._latencyProfiler = new _frameLatencyProfiler.FrameLatencyProfiler(_FRAME_LATENCY_LOG_PERIOD, _FRAME_DURATION_WARNING_THRESHOLD, _LATENCY_LOG_LABEL);
  }

  /**
   * Starts the given AnimationJob.
   *
   * @param {AnimationJob} job
   */


  _createClass(Animator, [{
    key: 'startJob',
    value: function startJob(job) {
      // Is this a restart?
      if (!job.isComplete) {
        console.debug('Restarting AnimationJob: ' + job.constructor.name);

        if (job instanceof _persistentAnimationJob.PersistentAnimationJob) {
          job.reset();
        } else {
          job.finish(true);
          job.start(window.performance.now());
        }
      } else {
        console.debug('Starting AnimationJob: ' + job.constructor.name);

        job.start(this._previousTime);
        this._jobs.push(job);
      }

      this._startAnimationLoop();
    }

    /**
     * Cancels the given AnimationJob.
     *
     * @param {AnimationJob} job
     */

  }, {
    key: 'cancelJob',
    value: function cancelJob(job) {
      console.debug('Cancelling AnimationJob: ' + job.constructor.name);
      job.finish(true);
    }

    /**
     * Cancels all running AnimationJobs.
     */

  }, {
    key: 'cancelAll',
    value: function cancelAll() {
      while (this._jobs.length) {
        this.cancelJob(this._jobs[0]);
      }
    }

    /** @returns {DOMHighResTimeStamp} */

  }, {
    key: 'pause',
    value: function pause() {
      this._stopAnimationLoop();
      console.debug('Animator paused');
    }
  }, {
    key: 'unpause',
    value: function unpause() {
      this._startAnimationLoop();
      console.debug('Animator unpaused');
    }

    /**
     * This is the animation loop that drives all of the animation.
     *
     * @param {DOMHighResTimeStamp} currentTime
     * @private
     */

  }, {
    key: '_animationLoop',
    value: function _animationLoop(currentTime) {
      var _this = this;

      // When pausing and restarting, it's possible for the previous time to be slightly inconsistent
      // with the animationFrame time.
      if (currentTime < this._previousTime) {
        this._previousTime = currentTime - 1;
      }

      var deltaTime = currentTime - this._previousTime;
      this._previousTime = currentTime;

      this._latencyProfiler.recordFrameLatency(deltaTime);

      // Large delays between frames can cause lead to instability in the system, so this caps them to
      // a max threshold.
      deltaTime = deltaTime > _DELTA_TIME_UPPER_THRESHOLD ? _DELTA_TIME_UPPER_THRESHOLD : deltaTime;

      if (!this._isPaused) {
        this._requestAnimationFrameId = window.requestAnimationFrame(function (currentTime) {
          return _this._animationLoop(currentTime);
        });
        this._updateJobs(currentTime, deltaTime);
        this._drawJobs();
      }
    }

    /**
     * Updates all of the active AnimationJobs.
     *
     * @param {DOMHighResTimeStamp} currentTime
     * @param {DOMHighResTimeStamp} deltaTime
     * @private
     */

  }, {
    key: '_updateJobs',
    value: function _updateJobs(currentTime, deltaTime) {
      for (var i = 0, count = this._jobs.length; i < count; i++) {
        var job = this._jobs[i];

        // Remove jobs from the list after they are complete.
        if (job.isComplete) {
          this._removeJob(job, i);
          i--;
          count--;
          continue;
        }

        // Check whether the job is transient and has reached its end.
        if (job instanceof _transientAnimationJob.TransientAnimationJob && job.endTime < currentTime) {
          job.finish(false);
        } else {
          job.update(currentTime, deltaTime);
        }
      }
    }

    /**
     * Removes the given job from the collection of active, animating jobs.
     *
     * @param {AnimationJob} job
     * @param {number} [index=-1]
     * @private
     */

  }, {
    key: '_removeJob',
    value: function _removeJob(job) {
      var index = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : -1;

      console.debug('Removing AnimationJob: ' + job.constructor.name);

      if (index >= 0) {
        this._jobs.splice(index, 1);
      } else {
        var count = this._jobs.length;
        for (index = 0; index < count; index++) {
          if (this._jobs[index] === job) {
            this._jobs.splice(index, 1);
            break;
          }
        }
      }

      // Stop the animation loop when there are no more jobs to animate.
      if (this._jobs.length === 0) {
        this._stopAnimationLoop();
      }
    }

    /**
     * Draws all of the active AnimationJobs.
     *
     * @private
     */

  }, {
    key: '_drawJobs',
    value: function _drawJobs() {
      for (var i = 0, count = this._jobs.length; i < count; i++) {
        this._jobs[i].draw();
      }
    }

    /**
     * Starts the animation loop if it is not already running.
     *
     * This method is idempotent.
     *
     * @private
     */

  }, {
    key: '_startAnimationLoop',
    value: function _startAnimationLoop() {
      var _this2 = this;

      if (this._isPaused) {
        this._lastUnpauseTime = window.performance.now();
      }
      this._isPaused = false;

      // Only actually start the loop if it isn't already running and the page has focus.
      if (!this._requestAnimationFrameId && !document.hidden) {
        this._latencyProfiler.start();
        this._previousTime = window.performance.now();
        this._requestAnimationFrameId = window.requestAnimationFrame(function (time) {
          return _this2._animationLoop(time);
        });
      }
    }

    /**
     * Stops the animation loop.
     *
     * @private
     */

  }, {
    key: '_stopAnimationLoop',
    value: function _stopAnimationLoop() {
      if (!this._isPaused) {
        this._totalUnpausedRunTime += this._timeSinceLastPaused;
      }
      this._isPaused = true;
      window.cancelAnimationFrame(this._requestAnimationFrameId);
      this._requestAnimationFrameId = null;
      this._latencyProfiler.stop();
    }

    /**
     * Creates a promise that will resolve on the next animation loop.
     *
     * @returns {Promise}
     */

  }, {
    key: 'resolveOnNextFrame',
    value: function resolveOnNextFrame() {
      return new Promise(window.requestAnimationFrame);
    }

    /**
     * Gets the total amount of time the animator has been running while not paused.
     *
     * @returns {DOMHighResTimeStamp}
     */

  }, {
    key: 'currentTime',
    get: function get() {
      return this._previousTime;
    }

    /** @returns {boolean} */

  }, {
    key: 'isPaused',
    get: function get() {
      return this._isPaused;
    }
  }, {
    key: 'totalRunTime',
    get: function get() {
      return this._isPaused ? this._totalUnpausedRunTime : this._totalUnpausedRunTime + this._timeSinceLastPaused;
    }

    /**
     * @returns {DOMHighResTimeStamp}
     */

  }, {
    key: '_timeSinceLastPaused',
    get: function get() {
      return window.performance.now() - this._lastUnpauseTime;
    }
  }]);

  return Animator;
}();

var animator = new Animator();

exports.animator = animator;

/**
 * @typedef {number} DOMHighResTimeStamp A number of milliseconds, accurate to one thousandth of a
 * millisecond.
 */

},{"./frame-latency-profiler":4,"./persistent-animation-job":6,"./transient-animation-job":7}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * This class keeps track of avg/min/max frame latencies over the last logging time period and
 * periodically logs these values.
 */
var FrameLatencyProfiler = function () {
  /**
   * @param {number} logPeriod The period at which to print latency log messages. In milliseconds.
   * @param {number} latencyWarningThreshold If the average latency exceeds this threshold, then the
   * log message is shown as a warning. In milliseconds.
   * @param {string} logLabel A label to show for each latency log message.
   */
  function FrameLatencyProfiler(logPeriod, latencyWarningThreshold, logLabel) {
    _classCallCheck(this, FrameLatencyProfiler);

    this._logPeriod = logPeriod;
    this._latencyWarningThreshold = latencyWarningThreshold;
    this._logLabel = logLabel;

    this._frameCount = null;
    this._maxFrameLatency = null;
    this._minFrameLatency = null;
    this._avgFrameLatency = null;

    this._intervalId = null;
  }

  _createClass(FrameLatencyProfiler, [{
    key: "start",
    value: function start() {
      var _this = this;

      this.stop();
      this.reset();

      this._intervalId = setInterval(function () {
        _this.logFrameLatency();
        _this.reset();
      }, this._logPeriod);
    }
  }, {
    key: "stop",
    value: function stop() {
      clearInterval(this._intervalId);
    }
  }, {
    key: "reset",
    value: function reset() {
      this._frameCount = 0;
      this._maxFrameLatency = Number.MIN_VALUE;
      this._minFrameLatency = Number.MAX_VALUE;
      this._avgFrameLatency = 0;
    }

    /**
     * Keeps track of a running average, min value, and max value for the frame latencies.
     *
     * @param {DOMHighResTimeStamp} frameLatency
     */

  }, {
    key: "recordFrameLatency",
    value: function recordFrameLatency(frameLatency) {
      this._frameCount++;
      this._maxFrameLatency = this._maxFrameLatency < frameLatency ? frameLatency : this._maxFrameLatency;
      this._minFrameLatency = this._minFrameLatency > frameLatency ? frameLatency : this._minFrameLatency;
      this._avgFrameLatency = this._avgFrameLatency + (frameLatency - this._avgFrameLatency) / this._frameCount;
    }
  }, {
    key: "logFrameLatency",
    value: function logFrameLatency() {
      if (this._frameCount > 0) {
        var message = this._logLabel + ":  AVG=" + this._avgFrameLatency.toFixed(3) + "  " + ("(MAX=" + this._maxFrameLatency.toFixed(3) + "; MIN=" + this._minFrameLatency.toFixed(3) + ")");
        if (this._maxFrameLatency >= this._latencyWarningThreshold) {
          console.warn(message);
        } else {
          console.debug(message);
        }
      }
    }
  }]);

  return FrameLatencyProfiler;
}();

exports.FrameLatencyProfiler = FrameLatencyProfiler;

},{}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _animationJob = require('./animation-job');

Object.keys(_animationJob).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _animationJob[key];
    }
  });
});

var _animator = require('./animator');

Object.keys(_animator).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _animator[key];
    }
  });
});

var _frameLatencyProfiler = require('./frame-latency-profiler');

Object.keys(_frameLatencyProfiler).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _frameLatencyProfiler[key];
    }
  });
});

var _persistentAnimationJob = require('./persistent-animation-job');

Object.keys(_persistentAnimationJob).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _persistentAnimationJob[key];
    }
  });
});

var _transientAnimationJob = require('./transient-animation-job');

Object.keys(_transientAnimationJob).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _transientAnimationJob[key];
    }
  });
});

},{"./animation-job":2,"./animator":3,"./frame-latency-profiler":4,"./persistent-animation-job":6,"./transient-animation-job":7}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PersistentAnimationJob = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _animationJob = require('./animation-job');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * A PersistentAnimationJob recurs or has an indefinite duration.
 *
 * @abstract
 */
var PersistentAnimationJob = function (_AnimationJob) {
  _inherits(PersistentAnimationJob, _AnimationJob);

  /**
   * @param {Function} [onComplete] A callback to be called when this AnimationJob is finished.
   */
  function PersistentAnimationJob(onComplete) {
    _classCallCheck(this, PersistentAnimationJob);

    // PersistentAnimationJob is an abstract class. It should not be instantiated directly.
    var _this = _possibleConstructorReturn(this, (PersistentAnimationJob.__proto__ || Object.getPrototypeOf(PersistentAnimationJob)).call(this, onComplete));

    if (new.target === PersistentAnimationJob) {
      throw new TypeError('Cannot construct PersistentAnimationJob instances directly');
    }
    return _this;
  }

  /**
   * @abstract
   */


  _createClass(PersistentAnimationJob, [{
    key: 'reset',
    value: function reset() {
      // Extending classes should implement this method.
      throw new TypeError('Method not implemented');
    }
  }]);

  return PersistentAnimationJob;
}(_animationJob.AnimationJob);

exports.PersistentAnimationJob = PersistentAnimationJob;

},{"./animation-job":2}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TransientAnimationJob = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _util2 = require('./util');

var _animationJob = require('./animation-job');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * A TransientAnimationJob is temporary and has a definite beginning and end.
 *
 * @abstract
 */
var TransientAnimationJob = function (_AnimationJob) {
  _inherits(TransientAnimationJob, _AnimationJob);

  /**
   * @param {number} duration
   * @param {number} delay
   * @param {Function|String} easingFunction
   * @param {Function} [onComplete] A callback to be called when this AnimationJob is finished.
   */
  function TransientAnimationJob(duration, delay, easingFunction, onComplete) {
    _classCallCheck(this, TransientAnimationJob);

    // TransientAnimationJob is an abstract class. It should not be instantiated directly.
    var _this = _possibleConstructorReturn(this, (TransientAnimationJob.__proto__ || Object.getPrototypeOf(TransientAnimationJob)).call(this, onComplete));

    if (new.target === TransientAnimationJob) {
      throw new TypeError('Cannot construct TransientAnimationJob instances directly');
    }

    _this._duration = duration;
    _this._delay = delay;
    _this._easingFunction = typeof easingFunction === 'function' ? easingFunction : _util2._util.easingFunctions[easingFunction];
    return _this;
  }

  /**
   * @returns {number}
   */


  _createClass(TransientAnimationJob, [{
    key: 'endTime',
    get: function get() {
      return this._startTime + this._duration + this._delay;
    }
  }]);

  return TransientAnimationJob;
}(_animationJob.AnimationJob);

exports.TransientAnimationJob = TransientAnimationJob;

},{"./animation-job":2,"./util":8}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * This module defines a collection of static utility functions.
 */

// A collection of different types of easing functions.
var easingFunctions = {
  linear: function linear(t) {
    return t;
  },
  easeInQuad: function easeInQuad(t) {
    return t * t;
  },
  easeOutQuad: function easeOutQuad(t) {
    return t * (2 - t);
  },
  easeInOutQuad: function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  },
  easeInCubic: function easeInCubic(t) {
    return t * t * t;
  },
  easeOutCubic: function easeOutCubic(t) {
    return 1 + --t * t * t;
  },
  easeInOutCubic: function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  },
  easeInQuart: function easeInQuart(t) {
    return t * t * t * t;
  },
  easeOutQuart: function easeOutQuart(t) {
    return 1 - --t * t * t * t;
  },
  easeInOutQuart: function easeInOutQuart(t) {
    return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t;
  },
  easeInQuint: function easeInQuint(t) {
    return t * t * t * t * t;
  },
  easeOutQuint: function easeOutQuint(t) {
    return 1 + --t * t * t * t * t;
  },
  easeInOutQuint: function easeInOutQuint(t) {
    return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t;
  }
};

var _util = {
  easingFunctions: easingFunctions
};

exports._util = _util;

},{}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _aabbCollidable = require('./src/aabb-collidable');

Object.keys(_aabbCollidable).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _aabbCollidable[key];
    }
  });
});

var _capsuleCollidable = require('./src/capsule-collidable');

Object.keys(_capsuleCollidable).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _capsuleCollidable[key];
    }
  });
});

var _collidable = require('./src/collidable');

Object.keys(_collidable).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _collidable[key];
    }
  });
});

var _lineSegment = require('./src/line-segment');

Object.keys(_lineSegment).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _lineSegment[key];
    }
  });
});

var _obbCollidable = require('./src/obb-collidable');

Object.keys(_obbCollidable).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _obbCollidable[key];
    }
  });
});

var _sphereCollidable = require('./src/sphere-collidable');

Object.keys(_sphereCollidable).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _sphereCollidable[key];
    }
  });
});

},{"./src/aabb-collidable":10,"./src/capsule-collidable":11,"./src/collidable":12,"./src/line-segment":13,"./src/obb-collidable":14,"./src/sphere-collidable":15}],10:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Aabb = undefined;

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _collidable = require('./collidable');

var _lineSegment = require('./line-segment');

var _util = require('../../../util');

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && ((typeof call === "undefined" ? "undefined" : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === "undefined" ? "undefined" : _typeof(superClass)));
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

/**
 * This class represents an axially-aligned bounding box (AABB).
 *
 * This is primarily useful for collision detection. An AABB is only appropriate for some
 * geometries. For other geometries, an oriented bounding box (OBB) or a bounding sphere may be more
 * appropriate.
 */
var Aabb = function (_Collidable) {
  _inherits(Aabb, _Collidable);

  /**
   * @param {number} minX
   * @param {number} minY
   * @param {number} minZ
   * @param {number} maxX
   * @param {number} maxY
   * @param {number} maxZ
   * @param {boolean} [isStationary=false]
   * @param {CollidablePhysicsJob} [physicsJob]
   */
  function Aabb(minX, minY, minZ, maxX, maxY, maxZ) {
    var isStationary = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : false;
    var physicsJob = arguments[7];

    _classCallCheck(this, Aabb);

    var _this = _possibleConstructorReturn(this, (Aabb.__proto__ || Object.getPrototypeOf(Aabb)).call(this, isStationary, physicsJob));

    _this.minX = minX;
    _this.minY = minY;
    _this.minZ = minZ;
    _this.maxX = maxX;
    _this.maxY = maxY;
    _this.maxZ = maxZ;
    return _this;
  }

  /**
   * Creates a new bounding box with the dimensions of an axially-aligned cube centered around the 
   * given center and with the given half-side length.
   *
   * @param {vec3} center
   * @param {number} halfSideLength
   */

  _createClass(Aabb, [{
    key: 'setAsUniformAroundCenter',

    /**
     * Updates the dimensions of this bounding box to represent an axially-aligned cube centered
     * around the given center and with the given half-side length.
     *
     * @param {vec3} center
     * @param {number} halfSideLength
     */
    value: function setAsUniformAroundCenter(center, halfSideLength) {
      this.minX = center[0] - halfSideLength;
      this.minY = center[1] - halfSideLength;
      this.minZ = center[2] - halfSideLength;
      this.maxX = center[0] + halfSideLength;
      this.maxY = center[1] + halfSideLength;
      this.maxZ = center[2] + halfSideLength;
    }

    /** @returns {number} */

  }, {
    key: 'someVertex',

    /**
     * Calls the given callback once for each vertex.
     *
     * Stops as soon as the callback returns true for a vertex.
     *
     * @param {VertexCallback} callback
     * @param {vec3} [vertex] Output param.
     * @returns {boolean} True if one of the callbacks returned true.
     */
    value: function someVertex(callback, vertex) {
      vertex = vertex || _util.tmpVec1;

      vec3.set(vertex, this.minX, this.minY, this.minZ);
      if (callback(vertex)) return true;

      vec3.set(vertex, this.maxX, this.minY, this.minZ);
      if (callback(vertex)) return true;

      vec3.set(vertex, this.minX, this.maxY, this.minZ);
      if (callback(vertex)) return true;

      vec3.set(vertex, this.maxX, this.maxY, this.minZ);
      if (callback(vertex)) return true;

      vec3.set(vertex, this.minX, this.minY, this.maxZ);
      if (callback(vertex)) return true;

      vec3.set(vertex, this.maxX, this.minY, this.maxZ);
      if (callback(vertex)) return true;

      vec3.set(vertex, this.minX, this.maxY, this.maxZ);
      if (callback(vertex)) return true;

      vec3.set(vertex, this.maxX, this.maxY, this.maxZ);
      if (callback(vertex)) return true;

      return false;
    }

    /**
     * Calls the given callback once for each edge.
     *
     * @param {EdgeCallback} callback
     * @param {LineSegment} [edge] Output param.
     * @returns {boolean} True if one of the callbacks returned true.
     */

  }, {
    key: 'someEdge',
    value: function someEdge(callback, edge) {
      edge = edge || _segment;

      //
      // Edges along front face.
      //

      vec3.set(_util.tmpVec1, this.minX, this.minY, this.minZ);
      vec3.set(_util.tmpVec2, this.maxX, this.minY, this.minZ);
      edge.reset(_util.tmpVec1, _util.tmpVec2);
      if (callback(edge)) return true;

      vec3.set(_util.tmpVec1, this.minX, this.maxY, this.minZ);
      vec3.set(_util.tmpVec2, this.maxX, this.maxY, this.minZ);
      edge.reset(_util.tmpVec1, _util.tmpVec2);
      if (callback(edge)) return true;

      vec3.set(_util.tmpVec1, this.minX, this.minY, this.minZ);
      vec3.set(_util.tmpVec2, this.minX, this.maxY, this.minZ);
      edge.reset(_util.tmpVec1, _util.tmpVec2);
      if (callback(edge)) return true;

      vec3.set(_util.tmpVec1, this.maxX, this.minY, this.minZ);
      vec3.set(_util.tmpVec2, this.maxX, this.maxY, this.minZ);
      edge.reset(_util.tmpVec1, _util.tmpVec2);
      if (callback(edge)) return true;

      //
      // Edges along back face.
      //

      vec3.set(_util.tmpVec1, this.minX, this.minY, this.maxZ);
      vec3.set(_util.tmpVec2, this.maxX, this.minY, this.maxZ);
      edge.reset(_util.tmpVec1, _util.tmpVec2);
      if (callback(edge)) return true;

      vec3.set(_util.tmpVec1, this.minX, this.maxY, this.maxZ);
      vec3.set(_util.tmpVec2, this.maxX, this.maxY, this.maxZ);
      edge.reset(_util.tmpVec1, _util.tmpVec2);
      if (callback(edge)) return true;

      vec3.set(_util.tmpVec1, this.minX, this.minY, this.maxZ);
      vec3.set(_util.tmpVec2, this.minX, this.maxY, this.maxZ);
      edge.reset(_util.tmpVec1, _util.tmpVec2);
      if (callback(edge)) return true;

      vec3.set(_util.tmpVec1, this.maxX, this.minY, this.maxZ);
      vec3.set(_util.tmpVec2, this.maxX, this.maxY, this.maxZ);
      edge.reset(_util.tmpVec1, _util.tmpVec2);
      if (callback(edge)) return true;

      //
      // Edges between front and back faces.
      //

      vec3.set(_util.tmpVec1, this.minX, this.minY, this.minZ);
      vec3.set(_util.tmpVec2, this.minX, this.minY, this.maxZ);
      edge.reset(_util.tmpVec1, _util.tmpVec2);
      if (callback(edge)) return true;

      vec3.set(_util.tmpVec1, this.maxX, this.minY, this.minZ);
      vec3.set(_util.tmpVec2, this.maxX, this.minY, this.maxZ);
      edge.reset(_util.tmpVec1, _util.tmpVec2);
      if (callback(edge)) return true;

      vec3.set(_util.tmpVec1, this.minX, this.maxY, this.minZ);
      vec3.set(_util.tmpVec2, this.minX, this.maxY, this.maxZ);
      edge.reset(_util.tmpVec1, _util.tmpVec2);
      if (callback(edge)) return true;

      vec3.set(_util.tmpVec1, this.maxX, this.maxY, this.minZ);
      vec3.set(_util.tmpVec2, this.maxX, this.maxY, this.maxZ);
      edge.reset(_util.tmpVec1, _util.tmpVec2);
      if (callback(edge)) return true;

      return false;
    }
  }, {
    key: 'rangeX',
    get: function get() {
      return this.maxX - this.minX;
    }
    /** @returns {number} */

  }, {
    key: 'rangeY',
    get: function get() {
      return this.maxY - this.minY;
    }
    /** @returns {number} */

  }, {
    key: 'rangeZ',
    get: function get() {
      return this.maxZ - this.minZ;
    }

    /** @returns {number} */

  }, {
    key: 'centerX',
    get: function get() {
      return this.minX + this.rangeX / 2;
    }
    /** @returns {number} */

  }, {
    key: 'centerY',
    get: function get() {
      return this.minY + this.rangeY / 2;
    }
    /** @returns {number} */

  }, {
    key: 'centerZ',
    get: function get() {
      return this.minZ + this.rangeZ / 2;
    }

    /** @returns {number} */

  }, {
    key: 'surfaceArea',
    get: function get() {
      var rangeX = this.rangeX;
      var rangeY = this.rangeY;
      var rangeZ = this.rangeZ;
      return 2 * (rangeX * rangeY + rangeX * rangeZ + rangeY * rangeZ);
    }

    /**
     * @returns {vec3}
     * @override
     */

  }, {
    key: 'centerOfVolume',
    get: function get() {
      // Reuse the same object when this is called multiple times.
      this._centerOfVolume = this._centerOfVolume || vec3.create();
      vec3.set(this._centerOfVolume, this.centerX, this.centerY, this.centerZ);
      return this._centerOfVolume;
    }

    /**
     * @returns {Collidable}
     * @override
     */

  }, {
    key: 'boundingVolume',
    get: function get() {
      return this;
    }

    /**
     * @param {vec3} value
     * @override
     */

  }, {
    key: 'position',
    set: function set(value) {
      var rangeX = this.rangeX;
      var rangeY = this.rangeY;
      var rangeZ = this.rangeZ;
      this.minX = value[0] - rangeX / 2;
      this.minY = value[1] - rangeY / 2;
      this.minZ = value[2] - rangeZ / 2;
      this.maxX = value[0] + rangeX / 2;
      this.maxY = value[1] + rangeY / 2;
      this.maxZ = value[2] + rangeZ / 2;
    }

    /**
     * @param {quat} value
     * @override
     */

  }, {
    key: 'orientation',
    set: function set(value) {}
    // Do nothing.

  }], [{
    key: 'createAsUniformAroundCenter',
    value: function createAsUniformAroundCenter(center, halfSideLength) {
      var bounds = new Aabb(0, 0, 0, 0, 0, 0);
      bounds.setAsUniformAroundCenter(center, halfSideLength);
      return bounds;
    }
  }]);

  return Aabb;
}(_collidable.Collidable);

var _segment = new _lineSegment.LineSegment(vec3.create(), vec3.create());

exports.Aabb = Aabb;

},{"../../../util":39,"./collidable":12,"./line-segment":13}],11:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Capsule = undefined;

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _collidable = require('./collidable');

var _lineSegment = require('./line-segment');

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && ((typeof call === "undefined" ? "undefined" : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === "undefined" ? "undefined" : _typeof(superClass)));
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

/**
 * This class represents a capsule.
 *
 * - A capsule is a cylinder with semi-spheres on either end.
 * - A capsule can represent a rough approximation of many useful shapes.
 * - A capsule can be used for relatively efficient collision detection.
 */
var Capsule = function (_Collidable) {
  _inherits(Capsule, _Collidable);

  /**
   * The default orientation of the capsule is along the z-axis.
   *
   * @param {number} halfDistance Half the distance from the centers of the capsule end spheres.
   * @param {number} radius
   * @param {boolean} [isStationary=false]
   * @param {CollidablePhysicsJob} [physicsJob]
   */
  function Capsule(halfDistance, radius) {
    var isStationary = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    var physicsJob = arguments[3];

    _classCallCheck(this, Capsule);

    var _this = _possibleConstructorReturn(this, (Capsule.__proto__ || Object.getPrototypeOf(Capsule)).call(this, isStationary, physicsJob));

    _this.halfDistance = halfDistance;
    _this.segment = new _lineSegment.LineSegment(vec3.fromValues(0, 0, -halfDistance), vec3.fromValues(0, 0, halfDistance));
    _this.radius = radius;
    return _this;
  }

  /**
   * @returns {vec3}
   * @override
   */

  _createClass(Capsule, [{
    key: 'centerOfVolume',
    get: function get() {
      return this.segment.center;
    }

    /**
     * @returns {Collidable}
     * @override
     */

  }, {
    key: 'boundingVolume',
    get: function get() {
      return this;
    }

    /**
     * @param {vec3} value
     * @override
     */

  }, {
    key: 'position',
    set: function set(value) {
      this.segment.center = value;
    }

    /**
     * @param {quat} value
     * @override
     */

  }, {
    key: 'orientation',
    set: function set(value) {
      this.segment.orientation = value;
    }
  }]);

  return Capsule;
}(_collidable.Collidable);

exports.Capsule = Capsule;

},{"./collidable":12,"./line-segment":13}],12:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

/**
 * This class represents a 3D collidable rigid object.
 *
 * This is useful for collision detection and response.
 *
 * @abstract
 */
var Collidable = function () {
  /**
   * @param {boolean} isStationary
   * @param {CollidablePhysicsJob} [physicsJob]
   */
  function Collidable(isStationary, physicsJob) {
    _classCallCheck(this, Collidable);

    // Collidable is an abstract class. It should not be instantiated directly.
    if (new.target === Collidable) {
      throw new TypeError('Cannot construct Collidable instances directly');
    }

    this.isStationary = isStationary;
    this.physicsJob = physicsJob;
    this.collisions = [];
    this.previousCollisions = [];
  }

  /**
   * Implementing classes can override this to provide a center of mass that is different than the
   * center of volume.
   *
   * @returns {vec3}
   */

  _createClass(Collidable, [{
    key: 'centerOfMass',
    get: function get() {
      return this.centerOfVolume;
    }

    /**
     * @returns {vec3}
     * @abstract
     */

  }, {
    key: 'centerOfVolume',
    get: function get() {
      // Extending classes should implement this method.
      throw new TypeError('Method not implemented');
    }

    /**
     * @returns {Collidable}
     * @abstract
     */

  }, {
    key: 'boundingVolume',
    get: function get() {
      // Extending classes should implement this method.
      throw new TypeError('Method not implemented');
    }

    /**
     * @param {vec3} value
     * @abstract
     */

  }, {
    key: 'position',
    set: function set(value) {
      // Extending classes should implement this method.
      throw new TypeError('Method not implemented');
    }

    /**
     * @param {quat} value
     * @abstract
     */

  }, {
    key: 'orientation',
    set: function set(value) {
      // Extending classes should implement this method.
      throw new TypeError('Method not implemented');
    }
  }]);

  return Collidable;
}();

exports.Collidable = Collidable;

},{}],13:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LineSegment = undefined;

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _util = require('../../../util');

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

/**
 * This class represents a line segment.
 */
var LineSegment = function () {
  /**
   * @param {vec3} start
   * @param {vec3} end
   */
  function LineSegment(start, end) {
    _classCallCheck(this, LineSegment);

    this.start = vec3.create();
    this.end = vec3.create();
    this._center = vec3.create();
    this._originalOrientationStart = vec3.create();
    this._originalOrientationEnd = vec3.create();
    this.reset(start, end);
  }

  /**
   * @param {vec3} start
   * @param {vec3} end
   */

  _createClass(LineSegment, [{
    key: 'reset',
    value: function reset(start, end) {
      vec3.copy(this.start, start);
      vec3.copy(this.end, end);
      vec3.subtract(this._originalOrientationStart, this.start, this.center);
      vec3.subtract(this._originalOrientationEnd, this.end, this.center);
    }

    /** @returns {LineSegment} */

  }, {
    key: 'clone',
    value: function clone() {
      var segment = new LineSegment(this.start, this.end);
      segment._originalOrientationStart = this._originalOrientationStart;
      segment._originalOrientationEnd = this._originalOrientationEnd;
      return segment;
    }

    /**
     * The UN-NORMALIZED direction of this segment.
     *
     * @returns {vec3}
     */

  }, {
    key: 'dir',
    get: function get() {
      // Reuse the same object when this is called multiple times.
      this._dir = this._dir || vec3.create();
      return vec3.subtract(this._dir, this.end, this.start);
    }

    /** @returns {vec3} */

  }, {
    key: 'center',
    get: function get() {
      vec3.lerp(this._center, this.start, this.end, 0.5);
      return this._center;
    }

    /** @param {vec3} value */

    , set: function set(value) {
      // Reuse the same object when this is called multiple times.
      this._displacement = this._displacement || vec3.create();
      vec3.subtract(this._displacement, value, this.center);

      vec3.add(this.start, this.start, this._displacement);
      vec3.add(this.end, this.end, this._displacement);
    }

    /** @param {quat} value */

  }, {
    key: 'orientation',
    set: function set(value) {
      vec3.transformQuat(_util.tmpVec1, this._originalOrientationStart, value);
      vec3.transformQuat(_util.tmpVec2, this._originalOrientationEnd, value);

      // We don't want this to be re-calculated between start/end updates.
      var center = this.center;

      vec3.add(this.start, center, _util.tmpVec1);
      vec3.add(this.end, center, _util.tmpVec2);
    }
  }]);

  return LineSegment;
}();

exports.LineSegment = LineSegment;

},{"../../../util":39}],14:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Obb = undefined;

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _collidable = require('./collidable');

var _sphereCollidable = require('./sphere-collidable');

var _lineSegment = require('./line-segment');

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && ((typeof call === "undefined" ? "undefined" : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === "undefined" ? "undefined" : _typeof(superClass)));
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

/**
 * This class represents an oriented bounding box (OBB).
 *
 * This is useful both for collision detection and for representing any rotated rectangular cuboid.
 * An OBB is only appropriate for some geometries. For other geometries, an axially-aligned bounding
 * box (AABB) or a bounding sphere may be more appropriate.
 */
var Obb = function (_Collidable) {
  _inherits(Obb, _Collidable);

  /**
   * Defaults to being centered at the origin with its local axes aligned with the world axes.
   *
   * @param {number} halfSideLengthX
   * @param {number} halfSideLengthY
   * @param {number} halfSideLengthZ
   * @param {boolean} [isStationary=false]
   * @param {CollidablePhysicsJob} [physicsJob]
   */
  function Obb(halfSideLengthX, halfSideLengthY, halfSideLengthZ) {
    var isStationary = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    var physicsJob = arguments[4];

    _classCallCheck(this, Obb);

    var _this = _possibleConstructorReturn(this, (Obb.__proto__ || Object.getPrototypeOf(Obb)).call(this, isStationary, physicsJob));

    _this.extents = [vec3.fromValues(halfSideLengthX, 0, 0), vec3.fromValues(0, halfSideLengthY, 0), vec3.fromValues(0, 0, halfSideLengthZ)];
    _this.axes = [vec3.fromValues(1, 0, 0), vec3.fromValues(0, 1, 0), vec3.fromValues(0, 0, 1)];
    _this.halfSideLengths = [halfSideLengthX, halfSideLengthY, halfSideLengthZ];
    _this._center = vec3.create();
    _this._orientation = quat.create();
    return _this;
  }

  /**
   * @returns {vec3}
   * @override
   */

  _createClass(Obb, [{
    key: 'someVertex',

    /**
     * Calls the given callback once for each vertex.
     *
     * Stops as soon as the callback returns true for a vertex.
     *
     * @param {VertexCallback} callback
     * @param {vec3} [vertex] Output param.
     * @returns {boolean} True if one of the callbacks returned true.
     */
    value: function someVertex(callback, vertex) {
      vertex = vertex || _vertex1;

      for (var xScale = -1; xScale <= 1; xScale += 2) {
        for (var yScale = -1; yScale <= 1; yScale += 2) {
          for (var zScale = -1; zScale <= 1; zScale += 2) {
            vec3.copy(vertex, this._center);
            vec3.scaleAndAdd(vertex, vertex, this.extents[0], xScale);
            vec3.scaleAndAdd(vertex, vertex, this.extents[1], yScale);
            vec3.scaleAndAdd(vertex, vertex, this.extents[2], zScale);
            if (callback(vertex)) {
              return true;
            }
          }
        }
      }
      return false;
    }

    /**
     * Calls the given callback once for each edge.
     *
     * @param {EdgeCallback} callback
     * @param {LineSegment} [edge] Output param.
     * @returns {boolean} True if one of the callbacks returned true.
     */

  }, {
    key: 'someEdge',
    value: function someEdge(callback, edge) {
      var _this2 = this;

      edge = edge || _segment;

      return _edgeExtentScales.some(function (edgeExtentScalePair) {
        var vertex1ExtentScales = edgeExtentScalePair[0];
        var vertex2ExtentScales = edgeExtentScalePair[1];

        // Calculate the edge's first and second vertex.
        vec3.copy(_vertex1, _this2._center);
        vec3.copy(_vertex2, _this2._center);
        for (var i = 0; i < 3; i++) {
          vec3.scaleAndAdd(_vertex1, _vertex1, _this2.extents[i], vertex1ExtentScales[i]);
          vec3.scaleAndAdd(_vertex2, _vertex2, _this2.extents[i], vertex2ExtentScales[i]);
        }

        // Call back with the edge.
        edge.reset(_vertex1, _vertex2);
        return callback(edge);
      });
    }

    /**
     * Calls the given callback once for each face.
     *
     * @param {FaceCallback} callback
     * @param {Array.<vec3>} [face] Output param.
     * @returns {boolean} True if one of the callbacks returned true.
     */

  }, {
    key: 'someFace',
    value: function someFace(callback, face) {
      var _this3 = this;

      face = face || [];

      return _faceExtentScales.some(function (faceExtentScales) {
        var vertex1ExtentScales = faceExtentScales[0];
        var vertex2ExtentScales = faceExtentScales[1];
        var vertex3ExtentScales = faceExtentScales[2];
        var vertex4ExtentScales = faceExtentScales[3];

        // Calculate the face's vertices.
        vec3.copy(_vertex1, _this3._center);
        vec3.copy(_vertex2, _this3._center);
        vec3.copy(_vertex3, _this3._center);
        vec3.copy(_vertex4, _this3._center);
        for (var i = 0; i < 3; i++) {
          vec3.scaleAndAdd(_vertex1, _vertex1, _this3.extents[i], vertex1ExtentScales[i]);
          vec3.scaleAndAdd(_vertex2, _vertex2, _this3.extents[i], vertex2ExtentScales[i]);
          vec3.scaleAndAdd(_vertex3, _vertex3, _this3.extents[i], vertex3ExtentScales[i]);
          vec3.scaleAndAdd(_vertex4, _vertex4, _this3.extents[i], vertex4ExtentScales[i]);
        }

        // Call back with the face.
        face.splice(0, 4, _vertex1, _vertex2, _vertex3, _vertex4);
        return callback(face);
      });
    }

    /**
     * Calls the given callback once for each face with a given additional offset from the center
     * applied to each face.
     *
     * @param {FaceCallback} callback
     * @param {number} radiusOffset
     * @param {Array.<vec3>} [face] Output param.
     * @returns {boolean} True if one of the callbacks returned true.
     */

  }, {
    key: 'somePushedOutFace',
    value: function somePushedOutFace(callback, radiusOffset, face) {
      var _this4 = this;

      face = face || [];

      return _faceExtentScales.some(function (faceExtentScales, index) {
        var vertex1ExtentScales = faceExtentScales[0];
        var vertex2ExtentScales = faceExtentScales[1];
        var vertex3ExtentScales = faceExtentScales[2];
        var vertex4ExtentScales = faceExtentScales[3];
        var directionOffsets = _pushedOutFaceOffsetDirections[index];

        // Calculate the face's vertices.
        vec3.copy(_vertex1, _this4._center);
        vec3.copy(_vertex2, _this4._center);
        vec3.copy(_vertex3, _this4._center);
        vec3.copy(_vertex4, _this4._center);
        for (var i = 0; i < 3; i++) {
          // Add the offset for the normal vertex position.
          vec3.scaleAndAdd(_vertex1, _vertex1, _this4.extents[i], vertex1ExtentScales[i]);
          vec3.scaleAndAdd(_vertex2, _vertex2, _this4.extents[i], vertex2ExtentScales[i]);
          vec3.scaleAndAdd(_vertex3, _vertex3, _this4.extents[i], vertex3ExtentScales[i]);
          vec3.scaleAndAdd(_vertex4, _vertex4, _this4.extents[i], vertex4ExtentScales[i]);
          // Add the pushed-out offset.
          vec3.scaleAndAdd(_vertex1, _vertex1, _this4.extents[i], radiusOffset / _this4.halfSideLengths[i] * directionOffsets[i]);
          vec3.scaleAndAdd(_vertex2, _vertex2, _this4.extents[i], radiusOffset / _this4.halfSideLengths[i] * directionOffsets[i]);
          vec3.scaleAndAdd(_vertex3, _vertex3, _this4.extents[i], radiusOffset / _this4.halfSideLengths[i] * directionOffsets[i]);
          vec3.scaleAndAdd(_vertex4, _vertex4, _this4.extents[i], radiusOffset / _this4.halfSideLengths[i] * directionOffsets[i]);
        }

        // Call back with the face.
        face.splice(0, 4, _vertex1, _vertex2, _vertex3, _vertex4);
        return callback(face);
      });
    }
  }, {
    key: '_updateExtents',
    value: function _updateExtents() {
      vec3.set(_vertex1, this.halfSideLengths[0], 0, 0);
      vec3.transformQuat(this.extents[0], _vertex1, this._orientation);
      vec3.set(_vertex1, 0, this.halfSideLengths[1], 0);
      vec3.transformQuat(this.extents[1], _vertex1, this._orientation);
      vec3.set(_vertex1, 0, 0, this.halfSideLengths[2]);
      vec3.transformQuat(this.extents[2], _vertex1, this._orientation);

      vec3.set(_vertex1, 1, 0, 0);
      vec3.transformQuat(this.axes[0], _vertex1, this._orientation);
      vec3.set(_vertex1, 0, 1, 0);
      vec3.transformQuat(this.axes[1], _vertex1, this._orientation);
      vec3.set(_vertex1, 0, 0, 1);
      vec3.transformQuat(this.axes[2], _vertex1, this._orientation);
    }
  }, {
    key: 'centerOfVolume',
    get: function get() {
      return this._center;
    }

    /**
     * @returns {Collidable}
     * @override
     */

  }, {
    key: 'boundingVolume',
    get: function get() {
      // Reuse the same value when this is called multiple times.
      if (!this._boundingSphere) {
        var radius = Math.sqrt(this.halfSideLengthX * this.halfSideLengthX + this.halfSideLengthY * this.halfSideLengthY + this.halfSideLengthZ * this.halfSideLengthZ);
        this._boundingSphere = new _sphereCollidable.Sphere(0, 0, 0, radius, this.isStationary);
      }
      this._boundingSphere.position = this._center;
      return this._boundingSphere;
    }

    /**
     * @param {vec3} value
     * @override
     */

  }, {
    key: 'position',
    set: function set(value) {
      vec3.copy(this._center, value);
    }

    /**
     * @param {quat} value
     * @override
     */

  }, {
    key: 'orientation',
    set: function set(value) {
      quat.copy(this._orientation, value);
      this._updateExtents();
    }
    /** @returns {quat} */

    , get: function get() {
      return this._orientation;
    }

    /** @returns {number} */

  }, {
    key: 'halfSideLengthX',
    get: function get() {
      return this.halfSideLengths[0];
    }
    /** @param {number} value */

    , set: function set(value) {
      this.halfSideLengths[0] = value;
      this._updateExtents();
    }

    /** @returns {number} */

  }, {
    key: 'halfSideLengthY',
    get: function get() {
      return this.halfSideLengths[1];
    }
    /** @param {number} value */

    , set: function set(value) {
      this.halfSideLengths[1] = value;
      this._updateExtents();
    }

    /** @returns {number} */

  }, {
    key: 'halfSideLengthZ',
    get: function get() {
      return this.halfSideLengths[2];
    }
    /** @param {number} value */

    , set: function set(value) {
      this.halfSideLengths[2] = value;
      this._updateExtents();
    }
  }]);

  return Obb;
}(_collidable.Collidable);

var _vertex1 = vec3.create();
var _vertex2 = vec3.create();
var _vertex3 = vec3.create();
var _vertex4 = vec3.create();
var _segment = new _lineSegment.LineSegment(vec3.create(), vec3.create());

var _edgeExtentScales = [
// Front-face edges.
[[1, -1, -1], [1, -1, 1]], [[1, -1, -1], [1, 1, -1]], [[1, 1, 1], [1, -1, 1]], [[1, 1, 1], [1, 1, -1]],
// Back-face edges.
[[-1, -1, -1], [-1, -1, 1]], [[-1, -1, -1], [-1, 1, -1]], [[-1, 1, 1], [-1, -1, 1]], [[-1, 1, 1], [-1, 1, -1]],
// Front-to-back edges.
[[1, -1, 1], [-1, -1, 1]], [[1, 1, -1], [-1, 1, -1]], [[1, 1, 1], [-1, 1, 1]], [[1, -1, -1], [-1, -1, -1]]];

var _faceExtentScales = [[[1, -1, -1], [1, -1, 1], [1, 1, 1], [1, 1, -1]], [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]], [[-1, 1, -1], [1, 1, -1], [1, 1, 1], [-1, 1, 1]], [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]], [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]], [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1]]];

var _pushedOutFaceOffsetDirections = [vec3.fromValues(1, 0, 0), vec3.fromValues(-1, 0, 0), vec3.fromValues(0, 1, 0), vec3.fromValues(0, -1, 0), vec3.fromValues(0, 0, 1), vec3.fromValues(0, 0, -1)];

exports.Obb = Obb;

/**
 * @callback VertexCallback
 * @param {vec3}
 * @returns {boolean} If true, iteration will stop.
 */

/**
 * @callback EdgeCallback
 * @param {LineSegment}
 * @returns {boolean} If true, iteration will stop.
 */

/**
 * @callback FaceCallback
 * @param {Array.<vec3>}
 * @returns {boolean} If true, iteration will stop.
 */

},{"./collidable":12,"./line-segment":13,"./sphere-collidable":15}],15:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Sphere = undefined;

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _collidable = require('./collidable');

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && ((typeof call === "undefined" ? "undefined" : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === "undefined" ? "undefined" : _typeof(superClass)));
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

/**
 * This class represents a bounding sphere.
 *
 * This is primarily useful for collision detection. A bounding sphere is only appropriate for some
 * geometries. For other geometries, an axially-aligned bounding box may be more appropriate. For
 * others still, an oriented bounding box or a more complicated hierarchical model may be more
 * appropriate.
 */
var Sphere = function (_Collidable) {
  _inherits(Sphere, _Collidable);

  /**
   * @param {number} centerX
   * @param {number} centerY
   * @param {number} centerZ
   * @param {number} radius
   * @param {boolean} [isStationary=false]
   * @param {CollidablePhysicsJob} [physicsJob]
   */
  function Sphere(centerX, centerY, centerZ, radius) {
    var isStationary = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;
    var physicsJob = arguments[5];

    _classCallCheck(this, Sphere);

    var _this = _possibleConstructorReturn(this, (Sphere.__proto__ || Object.getPrototypeOf(Sphere)).call(this, isStationary, physicsJob));

    _this.centerX = centerX;
    _this.centerY = centerY;
    _this.centerZ = centerZ;
    _this.radius = radius;
    return _this;
  }

  /**
   * @returns {vec3}
   * @override
   */

  _createClass(Sphere, [{
    key: 'centerOfVolume',
    get: function get() {
      // Reuse the same object when this is called multiple times.
      this._center = this._center || vec3.create();
      vec3.set(this._center, this.centerX, this.centerY, this.centerZ);
      return this._center;
    }

    /**
     * @returns {Collidable}
     * @override
     */

  }, {
    key: 'boundingVolume',
    get: function get() {
      return this;
    }

    /**
     * @param {vec3} value
     * @override
     */

  }, {
    key: 'position',
    set: function set(value) {
      this.centerX = value[0];
      this.centerY = value[1];
      this.centerZ = value[2];
    }

    /**
     * @param {quat} value
     * @override
     */

  }, {
    key: 'orientation',
    set: function set(value) {
      // Do nothing.
    }
  }]);

  return Sphere;
}(_collidable.Collidable);

exports.Sphere = Sphere;

},{"./collidable":12}],16:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sphereCollisionDetection = exports.obbCollisionDetection = exports.capsuleCollisionDetection = exports.aabbCollisionDetection = undefined;

var _aabbCollisionDetection = require('./src/aabb-collision-detection');

var aabbCollisionDetection = _interopRequireWildcard(_aabbCollisionDetection);

var _capsuleCollisionDetection = require('./src/capsule-collision-detection');

var capsuleCollisionDetection = _interopRequireWildcard(_capsuleCollisionDetection);

var _obbCollisionDetection = require('./src/obb-collision-detection');

var obbCollisionDetection = _interopRequireWildcard(_obbCollisionDetection);

var _sphereCollisionDetection = require('./src/sphere-collision-detection');

var sphereCollisionDetection = _interopRequireWildcard(_sphereCollisionDetection);

function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) {
    return obj;
  } else {
    var newObj = {};if (obj != null) {
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
      }
    }newObj.default = obj;return newObj;
  }
}

exports.aabbCollisionDetection = aabbCollisionDetection;
exports.capsuleCollisionDetection = capsuleCollisionDetection;
exports.obbCollisionDetection = obbCollisionDetection;
exports.sphereCollisionDetection = sphereCollisionDetection;

},{"./src/aabb-collision-detection":17,"./src/capsule-collision-detection":18,"./src/obb-collision-detection":19,"./src/sphere-collision-detection":20}],17:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.aabbVsCapsule = exports.aabbVsObb = exports.aabbVsAabb = exports.aabbVsSphere = exports.aabbVsPoint = undefined;

var _sphereCollisionDetection = require('./sphere-collision-detection');

var sphereCollisionDetection = _interopRequireWildcard(_sphereCollisionDetection);

var _obbCollisionDetection = require('./obb-collision-detection');

var obbCollisionDetection = _interopRequireWildcard(_obbCollisionDetection);

var _capsuleCollisionDetection = require('./capsule-collision-detection');

var capsuleCollisionDetection = _interopRequireWildcard(_capsuleCollisionDetection);

var _util = require('../../../util');

function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) {
    return obj;
  } else {
    var newObj = {};if (obj != null) {
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
      }
    }newObj.default = obj;return newObj;
  }
}

/**
 * This module defines utility methods for detecting whether intersection has occurred between
 * axially-aligned bounding boxes and other shapes.
 */

/**
 * @param {Aabb} aabb
 * @param {vec3} point
 * @returns {boolean}
 */
function aabbVsPoint(aabb, point) {
  return (0, _util.aabbVsPoint)(aabb, point);
}

/**
 * @param {Aabb} aabb
 * @param {Sphere} sphere
 * @returns {boolean}
 */
function aabbVsSphere(aabb, sphere) {
  return sphereCollisionDetection.sphereVsAabb(sphere, aabb);
}

/**
 * @param {Aabb} aabbA
 * @param {Aabb} aabbB
 * @returns {boolean}
 */
function aabbVsAabb(aabbA, aabbB) {
  return aabbA.maxX >= aabbB.minX && aabbA.minX <= aabbB.maxX && aabbA.maxY >= aabbB.minY && aabbA.minY <= aabbB.maxY && aabbA.maxZ >= aabbB.minZ && aabbA.minZ <= aabbB.maxZ;
}

/**
 * @param {Aabb} aabb
 * @param {Obb} obb
 * @returns {boolean}
 */
function aabbVsObb(aabb, obb) {
  return obbCollisionDetection.obbVsAabb(obb, aabb);
}

/**
 * @param {Aabb} aabb
 * @param {Capsule} capsule
 * @returns {boolean}
 */
function aabbVsCapsule(aabb, capsule) {
  return capsuleCollisionDetection.capsuleVsAabb(capsule, aabb);
}

exports.aabbVsPoint = aabbVsPoint;
exports.aabbVsSphere = aabbVsSphere;
exports.aabbVsAabb = aabbVsAabb;
exports.aabbVsObb = aabbVsObb;
exports.aabbVsCapsule = aabbVsCapsule;

},{"../../../util":39,"./capsule-collision-detection":18,"./obb-collision-detection":19,"./sphere-collision-detection":20}],18:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.capsuleVsCapsule = exports.capsuleVsObb = exports.capsuleVsAabb = exports.capsuleVsSphere = exports.capsuleVsPoint = undefined;

var _util = require('../../../util');

var _obbCollisionDetection = require('./obb-collision-detection');

var obbCollisionDetection = _interopRequireWildcard(_obbCollisionDetection);

function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) {
    return obj;
  } else {
    var newObj = {};if (obj != null) {
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
      }
    }newObj.default = obj;return newObj;
  }
}

/**
 * @param {Capsule} capsule
 * @param {vec3} point
 * @returns {boolean}
 */
/**
 * This module defines utility methods for detecting whether intersection has occurred between
 * capsules and other shapes.
 */

function capsuleVsPoint(capsule, point) {
  return (0, _util.findSquaredDistanceFromSegmentToPoint)(capsule.segment, point) <= capsule.radius * capsule.radius;
}

/**
 * @param {Capsule} capsule
 * @param {Sphere} sphere
 * @returns {boolean}
 */
function capsuleVsSphere(capsule, sphere) {
  var sumOfRadii = capsule.radius + sphere.radius;
  return (0, _util.findSquaredDistanceFromSegmentToPoint)(capsule.segment, sphere.centerOfVolume) <= sumOfRadii * sumOfRadii;
}

/**
 * NOTE: This implementation cheats by checking whether vertices from one shape lie within the
 * other. Due to the tunnelling problem, it is possible that intersection occurs without any
 * vertices lying within the other shape. However, (A) this is unlikely, and (B) we are ignoring the
 * tunnelling problem for the rest of this collision system anyway.
 *
 * @param {Capsule} capsule
 * @param {Aabb} aabb
 * @returns {boolean}
 */
function capsuleVsAabb(capsule, aabb) {
  var squaredRadius = capsule.radius * capsule.radius;

  // Check whether the two capsule ends intersect the AABB (sphere vs AABB) (addresses the
  // capsule-vs-AABB-face case).
  (0, _util.findClosestPointFromAabbToPoint)(_util.tmpVec1, aabb, capsule.segment.start);
  if (vec3.squaredDistance(_util.tmpVec1, capsule.segment.start) <= squaredRadius) {
    return true;
  }
  (0, _util.findClosestPointFromAabbToPoint)(_util.tmpVec1, aabb, capsule.segment.end);
  if (vec3.squaredDistance(_util.tmpVec1, capsule.segment.end) <= squaredRadius) {
    return true;
  }

  // Check whether the capsule intersects with any AABB edge (addresses the capsule-vs-AABB-edge
  // case).
  return aabb.someEdge(function (edge) {
    return (0, _util.findSquaredDistanceBetweenSegments)(capsule.segment, edge) <= squaredRadius;
  });

  // (The capsule-vs-AABB-vertex case is covered by the capsule-vs-AABB-edge case).
}

/**
 * @param {Capsule} capsule
 * @param {Obb} obb
 * @returns {boolean}
 */
function capsuleVsObb(capsule, obb) {
  return obbCollisionDetection.obbVsCapsule(obb, capsule);
}

/**
 * @param {Capsule} capsuleA
 * @param {Capsule} capsuleB
 * @returns {boolean}
 */
function capsuleVsCapsule(capsuleA, capsuleB) {
  var sumOfRadii = capsuleA.radius + capsuleB.radius;
  return (0, _util.findSquaredDistanceBetweenSegments)(capsuleA.segment, capsuleB.segment) <= sumOfRadii * sumOfRadii;
}

exports.capsuleVsPoint = capsuleVsPoint;
exports.capsuleVsSphere = capsuleVsSphere;
exports.capsuleVsAabb = capsuleVsAabb;
exports.capsuleVsObb = capsuleVsObb;
exports.capsuleVsCapsule = capsuleVsCapsule;

},{"../../../util":39,"./obb-collision-detection":19}],19:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.obbVsCapsule = exports.obbVsObb = exports.obbVsAabb = exports.obbVsSphere = exports.obbVsPoint = undefined;

var _util = require('../../../util');

var _aabbCollisionDetection = require('./aabb-collision-detection');

var aabbCollisionDetection = _interopRequireWildcard(_aabbCollisionDetection);

var _capsuleCollisionDetection = require('./capsule-collision-detection');

var capsuleCollisionDetection = _interopRequireWildcard(_capsuleCollisionDetection);

function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) {
    return obj;
  } else {
    var newObj = {};if (obj != null) {
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
      }
    }newObj.default = obj;return newObj;
  }
}

function _toConsumableArray(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
      arr2[i] = arr[i];
    }return arr2;
  } else {
    return Array.from(arr);
  }
} /**
   * This module defines utility methods for detecting whether intersection has occurred between
   * oriented bounding boxes and other shapes.
   */

// TODO: Refactor these to not actually calculate the point of intersection. These checks can
// instead be done more efficiently using SAT.

/**
 * @param {Obb} obb
 * @param {vec3} point
 * @returns {boolean}
 */
function obbVsPoint(obb, point) {
  vec3.subtract(_util.tmpVec4, point, obb.centerOfVolume);

  vec3.set(_util.tmpVec1, 1, 0, 0);
  vec3.transformQuat(_util.tmpVec1, _util.tmpVec1, obb.orientation);
  var axis1Distance = vec3.dot(_util.tmpVec4, _util.tmpVec1);

  if (axis1Distance >= -obb.halfSideLengthX && axis1Distance <= obb.halfSideLengthX) {
    vec3.set(_util.tmpVec2, 0, 1, 0);
    vec3.transformQuat(_util.tmpVec2, _util.tmpVec2, obb.orientation);
    var axis2Distance = vec3.dot(_util.tmpVec4, _util.tmpVec2);

    if (axis2Distance >= -obb.halfSideLengthY && axis2Distance <= obb.halfSideLengthY) {
      vec3.set(_util.tmpVec3, 0, 0, 1);
      vec3.transformQuat(_util.tmpVec3, _util.tmpVec3, obb.orientation);
      var axis3Distance = vec3.dot(_util.tmpVec4, _util.tmpVec3);

      return axis3Distance >= -obb.halfSideLengthZ && axis3Distance <= obb.halfSideLengthZ;
    }
  }

  return false;
}

/**
 * @param {Obb} obb
 * @param {Sphere} sphere
 * @returns {boolean}
 */
function obbVsSphere(obb, sphere) {
  (0, _util.findClosestPointFromObbToPoint)(_util.tmpVec1, obb, sphere.centerOfVolume);
  return vec3.squaredDistance(_util.tmpVec1, sphere.centerOfVolume) <= sphere.radius * sphere.radius;
}

/**
 * NOTE: This implementation cheats by checking whether vertices from one shape lie within the
 * other. Due to the tunnelling problem, it is possible that intersection occurs without any
 * vertices lying within the other shape. However, (A) this is unlikely, and (B) we are ignoring the
 * tunnelling problem for the rest of this collision system anyway.
 *
 * @param {Obb} obb
 * @param {Aabb} aabb
 * @returns {boolean}
 */
function obbVsAabb(obb, aabb) {
  return _obbVsBoxHelper(obb, aabb, aabbCollisionDetection.aabbVsPoint);
}

/**
 * NOTE: This implementation cheats by checking whether vertices from one shape lie within the
 * other. Due to the tunnelling problem, it is possible that intersection occurs without any
 * vertices lying within the other shape. However, (A) this is unlikely, and (B) we are ignoring the
 * tunnelling problem for the rest of this collision system anyway.
 *
 * @param {Obb} obbA
 * @param {Obb} obbB
 * @returns {boolean}
 */
function obbVsObb(obbA, obbB) {
  return _obbVsBoxHelper(obbA, obbB, obbVsPoint);
}

/**
 * @param {Obb} obb
 * @param {Obb|Aabb} other
 * @param {Function} otherVsPointCallback
 * @returns {boolean}
 * @private
 */
function _obbVsBoxHelper(obb, other, otherVsPointCallback) {
  // Check whether any vertices from A lie within B's bounds.
  if (obb.someVertex(function (vertex) {
    return otherVsPointCallback(other, vertex);
  })) return true;

  // Check whether any vertices from B lie within A's bounds.
  if (other.someVertex(function (vertex) {
    return obbVsPoint(obb, vertex);
  })) return true;

  // We assume that a vertex-to-face collision would have been detected by one of the two above
  // checks. Any edge-to-edge collision must involve both an edge from A through a face of B and
  // vice versa. So it is sufficient to only check the edges of one and the faces of the other.
  if (other.someEdge(function (edge) {
    return obb.someFace(function (face) {
      return _util.findPoiBetweenSegmentAndPlaneRegion.apply(undefined, [_util.tmpVec1, edge].concat(_toConsumableArray(face)));
    });
  })) return true;

  return false;
}

/**
 * @param {Obb} obb
 * @param {Capsule} capsule
 * @returns {boolean}
 */
function obbVsCapsule(obb, capsule) {
  // Check the edges.
  var squaredRadius = capsule.radius * capsule.radius;
  var areIntersecting = obb.someEdge(function (edge) {
    return (0, _util.findSquaredDistanceBetweenSegments)(capsule.segment, edge) < squaredRadius;
  });

  if (areIntersecting) return true;

  // Check the faces.
  areIntersecting = obb.somePushedOutFace(function (face) {
    return _util.findPoiBetweenSegmentAndPlaneRegion.apply(undefined, [_util.tmpVec1, capsule.segment].concat(_toConsumableArray(face)));
  }, capsule.radius);

  // Check for inclusion of one shape inside the other.
  areIntersecting = areIntersecting || obbVsPoint(obb, capsule.centerOfVolume);
  areIntersecting = areIntersecting || capsuleCollisionDetection.capsuleVsPoint(capsule, obb.centerOfVolume);

  return areIntersecting;
}

exports.obbVsPoint = obbVsPoint;
exports.obbVsSphere = obbVsSphere;
exports.obbVsAabb = obbVsAabb;
exports.obbVsObb = obbVsObb;
exports.obbVsCapsule = obbVsCapsule;

},{"../../../util":39,"./aabb-collision-detection":17,"./capsule-collision-detection":18}],20:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sphereVsCapsule = exports.sphereVsObb = exports.sphereVsAabb = exports.sphereVsSphere = exports.sphereVsPoint = undefined;

var _util = require('../../../util');

var _obbCollisionDetection = require('./obb-collision-detection');

var obbCollisionDetection = _interopRequireWildcard(_obbCollisionDetection);

var _capsuleCollisionDetection = require('./capsule-collision-detection');

var capsuleCollisionDetection = _interopRequireWildcard(_capsuleCollisionDetection);

function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) {
    return obj;
  } else {
    var newObj = {};if (obj != null) {
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
      }
    }newObj.default = obj;return newObj;
  }
}

/**
 * This module defines utility methods for detecting whether intersection has occurred between
 * spheres and other shapes.
 */

/**
 * @param {Sphere} sphere
 * @param {vec3} point
 * @returns {boolean}
 */
function sphereVsPoint(sphere, point) {
  return vec3.squaredDistance(point, sphere.centerOfVolume) <= sphere.radius * sphere.radius;
}

/**
 * @param {Sphere} sphereA
 * @param {Sphere} sphereB
 * @returns {boolean}
 */
function sphereVsSphere(sphereA, sphereB) {
  var sumOfRadii = sphereA.radius + sphereB.radius;
  return vec3.squaredDistance(sphereA.centerOfVolume, sphereB.centerOfVolume) <= sumOfRadii * sumOfRadii;
}

/**
 * @param {Sphere} sphere
 * @param {Aabb} aabb
 * @returns {boolean}
 */
function sphereVsAabb(sphere, aabb) {
  (0, _util.findClosestPointFromAabbToPoint)(_util.tmpVec1, aabb, sphere.centerOfVolume);
  return vec3.squaredDistance(_util.tmpVec1, sphere.centerOfVolume) <= sphere.radius * sphere.radius;
}

/**
 * @param {Sphere} sphere
 * @param {Obb} obb
 * @returns {boolean}
 */
function sphereVsObb(sphere, obb) {
  return obbCollisionDetection.obbVsSphere(obb, sphere);
}

/**
 * @param {Sphere} sphere
 * @param {Capsule} capsule
 * @returns {boolean}
 */
function sphereVsCapsule(sphere, capsule) {
  return capsuleCollisionDetection.capsuleVsSphere(capsule, sphere);
}

exports.sphereVsPoint = sphereVsPoint;
exports.sphereVsSphere = sphereVsSphere;
exports.sphereVsAabb = sphereVsAabb;
exports.sphereVsObb = sphereVsObb;
exports.sphereVsCapsule = sphereVsCapsule;

},{"../../../util":39,"./capsule-collision-detection":18,"./obb-collision-detection":19}],21:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sphereContactCalculation = exports.obbContactCalculation = exports.capsuleContactCalculation = exports.aabbContactCalculation = undefined;

var _aabbContactCalculation = require('./src/aabb-contact-calculation');

var aabbContactCalculation = _interopRequireWildcard(_aabbContactCalculation);

var _capsuleContactCalculation = require('./src/capsule-contact-calculation');

var capsuleContactCalculation = _interopRequireWildcard(_capsuleContactCalculation);

var _obbContactCalculation = require('./src/obb-contact-calculation');

var obbContactCalculation = _interopRequireWildcard(_obbContactCalculation);

var _sphereContactCalculation = require('./src/sphere-contact-calculation');

var sphereContactCalculation = _interopRequireWildcard(_sphereContactCalculation);

function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) {
    return obj;
  } else {
    var newObj = {};if (obj != null) {
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
      }
    }newObj.default = obj;return newObj;
  }
}

exports.aabbContactCalculation = aabbContactCalculation;
exports.capsuleContactCalculation = capsuleContactCalculation;
exports.obbContactCalculation = obbContactCalculation;
exports.sphereContactCalculation = sphereContactCalculation;

},{"./src/aabb-contact-calculation":22,"./src/capsule-contact-calculation":23,"./src/obb-contact-calculation":24,"./src/sphere-contact-calculation":25}],22:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.findAabbNormalFromContactPoint = exports.aabbVsCapsule = exports.aabbVsObb = exports.aabbVsAabb = exports.aabbVsSphere = exports.aabbVsPoint = undefined;

var _sphereContactCalculation = require('./sphere-contact-calculation');

var sphereContactCalculation = _interopRequireWildcard(_sphereContactCalculation);

var _obbContactCalculation = require('./obb-contact-calculation');

var obbContactCalculation = _interopRequireWildcard(_obbContactCalculation);

var _capsuleContactCalculation = require('./capsule-contact-calculation');

var capsuleContactCalculation = _interopRequireWildcard(_capsuleContactCalculation);

var _util = require('../../../util');

var _collisionDetection = require('../../collision-detection');

function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) {
    return obj;
  } else {
    var newObj = {};if (obj != null) {
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
      }
    }newObj.default = obj;return newObj;
  }
}

/**
 * @param {vec3} contactPoint Output param.
 * @param {vec3} contactNormal Output param.
 * @param {Aabb} aabb
 * @param {vec3} point
 */
function aabbVsPoint(contactPoint, contactNormal, aabb, point) {
  vec3.copy(contactPoint, point);
  findAabbNormalFromContactPoint(contactNormal, contactPoint, aabb);
}

/**
 * @param {vec3} contactPoint Output param.
 * @param {vec3} contactNormal Output param.
 * @param {Aabb} aabb
 * @param {Sphere} sphere
 */
/**
 * This module defines utility methods for calculating a contact point between axially-aligned 
 * bounding boxes and other shapes.
 *
 * - Each of these functions assumes that the objects are actually colliding.
 * - The resulting contact point may be anywhere within the intersection of the two objects.
 */

function aabbVsSphere(contactPoint, contactNormal, aabb, sphere) {
  sphereContactCalculation.sphereVsAabb(contactPoint, contactNormal, sphere, aabb);
  vec3.negate(contactNormal, contactNormal);
}

/**
 * @param {vec3} contactPoint Output param.
 * @param {vec3} contactNormal Output param.
 * @param {Aabb} aabbA
 * @param {Aabb} aabbB
 */
function aabbVsAabb(contactPoint, contactNormal, aabbA, aabbB) {
  // Compute the contact normal.
  vec3.set(contactNormal, 0, 0, 0);
  var xIntersectionDepth = Math.min(aabbA.maxX - aabbB.minX, aabbB.maxX - aabbA.minX);
  var yIntersectionDepth = Math.min(aabbA.maxY - aabbB.minY, aabbB.maxY - aabbA.minY);
  var zIntersectionDepth = Math.min(aabbA.maxZ - aabbB.minZ, aabbB.maxZ - aabbA.minZ);
  // Assume that the direction of intersection corresponds to whichever axis has the shallowest
  // intersection.
  if (xIntersectionDepth <= yIntersectionDepth) {
    if (xIntersectionDepth <= zIntersectionDepth) {
      contactNormal[0] = aabbA.maxX - aabbB.minX <= aabbB.maxX - aabbA.minX ? 1 : -1;
    } else {
      contactNormal[2] = aabbA.maxZ - aabbB.minZ <= aabbB.maxZ - aabbA.minZ ? 1 : -1;
    }
  } else {
    if (yIntersectionDepth <= zIntersectionDepth) {
      contactNormal[1] = aabbA.maxY - aabbB.minY <= aabbB.maxY - aabbA.minY ? 1 : -1;
    } else {
      contactNormal[2] = aabbA.maxZ - aabbB.minZ <= aabbB.maxZ - aabbA.minZ ? 1 : -1;
    }
  }

  // TODO: The two AABBs form a square intersection cross-section region along the direction of the
  // normal. Calculate the center of that square to use as the point of contact.
  if (!aabbA.someVertex(function (vertex) {
    return _collisionDetection.aabbCollisionDetection.aabbVsPoint(aabbB, vertex);
  }, contactPoint)) {
    aabbB.someVertex(function (vertex) {
      return _collisionDetection.aabbCollisionDetection.aabbVsPoint(aabbA, vertex);
    }, contactPoint);
  }
}

/**
 * @param {vec3} contactPoint Output param.
 * @param {vec3} contactNormal Output param.
 * @param {Aabb} aabb
 * @param {Obb} obb
 */
function aabbVsObb(contactPoint, contactNormal, aabb, obb) {
  obbContactCalculation.obbVsAabb(contactPoint, contactNormal, obb, aabb);
  vec3.negate(contactNormal, contactNormal);
}

/**
 * @param {vec3} contactPoint Output param.
 * @param {vec3} contactNormal Output param.
 * @param {Aabb} aabb
 * @param {Capsule} capsule
 */
function aabbVsCapsule(contactPoint, contactNormal, aabb, capsule) {
  capsuleContactCalculation.capsuleVsAabb(contactPoint, contactNormal, capsule, aabb);
  vec3.negate(contactNormal, contactNormal);
}

/**
 * @param {vec3} contactNormal Output param.
 * @param {vec3} contactPoint
 * @param {Aabb} aabb
 * @private
 */
function findAabbNormalFromContactPoint(contactNormal, contactPoint, aabb) {
  vec3.set(contactNormal, 0, 0, 0);
  vec3.subtract(_util.tmpVec1, contactPoint, aabb.centerOfVolume);
  var xDistanceFromFace = aabb.rangeX / 2 - Math.abs(_util.tmpVec1[0]);
  var yDistanceFromFace = aabb.rangeY / 2 - Math.abs(_util.tmpVec1[1]);
  var zDistanceFromFace = aabb.rangeZ / 2 - Math.abs(_util.tmpVec1[2]);
  // Assume that the point is contacting whichever face it's closest to.
  if (xDistanceFromFace <= yDistanceFromFace) {
    if (xDistanceFromFace <= zDistanceFromFace) {
      contactNormal[0] = _util.tmpVec1[0] > 0 ? 1 : -1;
    } else {
      contactNormal[2] = _util.tmpVec1[2] > 0 ? 1 : -1;
    }
  } else {
    if (yDistanceFromFace <= zDistanceFromFace) {
      contactNormal[1] = _util.tmpVec1[1] > 0 ? 1 : -1;
    } else {
      contactNormal[2] = _util.tmpVec1[2] > 0 ? 1 : -1;
    }
  }
}

exports.aabbVsPoint = aabbVsPoint;
exports.aabbVsSphere = aabbVsSphere;
exports.aabbVsAabb = aabbVsAabb;
exports.aabbVsObb = aabbVsObb;
exports.aabbVsCapsule = aabbVsCapsule;
exports.findAabbNormalFromContactPoint = findAabbNormalFromContactPoint;

},{"../../../util":39,"../../collision-detection":16,"./capsule-contact-calculation":23,"./obb-contact-calculation":24,"./sphere-contact-calculation":25}],23:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.capsuleVsCapsule = exports.capsuleVsObb = exports.capsuleVsAabb = exports.capsuleVsSphere = exports.capsuleVsPoint = undefined;

var _util = require('../../../util');

var _obbContactCalculation = require('./obb-contact-calculation');

var obbContactCalculation = _interopRequireWildcard(_obbContactCalculation);

function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) {
    return obj;
  } else {
    var newObj = {};if (obj != null) {
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
      }
    }newObj.default = obj;return newObj;
  }
}

/**
 * @param {vec3} contactPoint Output param.
 * @param {vec3} contactNormal Output param.
 * @param {Capsule} capsule
 * @param {vec3} point
 */
/**
 * This module defines utility methods for calculating a contact point between capsules and other 
 * shapes.
 *
 * - Each of these functions assumes that the objects are actually colliding.
 * - The resulting contact point may be anywhere within the intersection of the two objects.
 */

function capsuleVsPoint(contactPoint, contactNormal, capsule, point) {
  vec3.copy(contactPoint, point);
  (0, _util.findClosestPointOnSegmentToPoint)(contactNormal, capsule.segment, point);
  vec3.subtract(contactNormal, contactPoint, contactNormal);
  vec3.normalize(contactNormal, contactNormal);
}

/**
 * Finds the closest point on the surface of the capsule to the sphere center.
 *
 * @param {vec3} contactPoint Output param.
 * @param {vec3} contactNormal Output param.
 * @param {Capsule} capsule
 * @param {Sphere} sphere
 */
function capsuleVsSphere(contactPoint, contactNormal, capsule, sphere) {
  var sphereCenter = sphere.centerOfVolume;
  (0, _util.findClosestPointOnSegmentToPoint)(contactPoint, capsule.segment, sphereCenter);
  vec3.subtract(contactNormal, sphereCenter, contactPoint);
  vec3.normalize(contactNormal, contactNormal);
  vec3.scaleAndAdd(contactPoint, contactPoint, contactNormal, capsule.radius);
}

/**
 * Finds the closest point on the surface of the capsule to the AABB.
 *
 * NOTE: This implementation cheats by checking whether vertices from one shape lie within the
 * other. Due to the tunnelling problem, it is possible that intersection occurs without any
 * vertices lying within the other shape. However, (A) this is unlikely, and (B) we are ignoring the
 * tunnelling problem for the rest of this collision system anyway.
 *
 * @param {vec3} contactPoint Output param.
 * @param {vec3} contactNormal Output param.
 * @param {Capsule} capsule
 * @param {Aabb} aabb
 */
function capsuleVsAabb(contactPoint, contactNormal, capsule, aabb) {
  // tmpVec1 represents the closest point on the capsule to the AABB. tmpVec2
  // represents the closest point on the AABB to the capsule.

  //
  // Check whether the two capsule ends intersect the AABB (sphere vs AABB) (addresses the
  // capsule-vs-AABB-face case).
  //

  var squaredRadius = capsule.radius * capsule.radius;
  var doesAabbIntersectAnEndPoint = false;

  var endPoint = capsule.segment.start;
  (0, _util.findClosestPointFromAabbToPoint)(_util.tmpVec2, aabb, endPoint);
  if (vec3.squaredDistance(_util.tmpVec2, endPoint) <= squaredRadius) {
    doesAabbIntersectAnEndPoint = true;
  } else {
    endPoint = capsule.segment.end;
    (0, _util.findClosestPointFromAabbToPoint)(_util.tmpVec2, aabb, endPoint);
    if (vec3.squaredDistance(_util.tmpVec2, endPoint) <= squaredRadius) {
      doesAabbIntersectAnEndPoint = true;
    }
  }

  if (!doesAabbIntersectAnEndPoint) {
    //
    // Check whether the capsule intersects with any AABB edge (addresses the capsule-vs-AABB-edge
    // case).
    //
    aabb.someEdge(function (edge) {
      (0, _util.findClosestPointsFromSegmentToSegment)(_util.tmpVec1, _util.tmpVec2, capsule.segment, edge);
      var distance = vec3.squaredDistance(_util.tmpVec1, _util.tmpVec2);
      return distance <= squaredRadius;
    });
  }

  // (The capsule-vs-AABB-vertex case is covered by the capsule-vs-AABB-edge case).

  (0, _util.findClosestPointOnSegmentToPoint)(_util.tmpVec1, capsule.segment, _util.tmpVec2);
  vec3.subtract(contactNormal, _util.tmpVec2, _util.tmpVec1);
  vec3.normalize(contactNormal, contactNormal);
  vec3.scaleAndAdd(contactPoint, _util.tmpVec1, contactNormal, capsule.radius);
}

/**
 * @param {vec3} contactPoint Output param.
 * @param {vec3} contactNormal Output param.
 * @param {Capsule} capsule
 * @param {Obb} obb
 */
function capsuleVsObb(contactPoint, contactNormal, capsule, obb) {
  obbContactCalculation.obbVsCapsule(contactPoint, contactNormal, obb, capsule);
  vec3.negate(contactNormal, contactNormal);
}

/**
 * Finds the closest point on the surface of capsule A to capsule B.
 *
 * @param {vec3} contactPoint Output param.
 * @param {vec3} contactNormal Output param.
 * @param {Capsule} capsuleA
 * @param {Capsule} capsuleB
 */
function capsuleVsCapsule(contactPoint, contactNormal, capsuleA, capsuleB) {
  (0, _util.findClosestPointsFromSegmentToSegment)(_util.tmpVec1, _util.tmpVec2, capsuleA.segment, capsuleB.segment);
  vec3.subtract(contactNormal, _util.tmpVec2, _util.tmpVec1);
  vec3.normalize(contactNormal, contactNormal);
  vec3.scaleAndAdd(contactPoint, _util.tmpVec1, contactNormal, capsuleA.radius);
}

exports.capsuleVsPoint = capsuleVsPoint;
exports.capsuleVsSphere = capsuleVsSphere;
exports.capsuleVsAabb = capsuleVsAabb;
exports.capsuleVsObb = capsuleVsObb;
exports.capsuleVsCapsule = capsuleVsCapsule;

},{"../../../util":39,"./obb-contact-calculation":24}],24:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.findObbNormalFromContactPoint = exports.obbVsCapsule = exports.obbVsObb = exports.obbVsAabb = exports.obbVsSphere = exports.obbVsPoint = undefined;

var _util = require('../../../util');

var _collisionDetection = require('../../collision-detection');

var _collidables = require('../../collidables');

var _aabbContactCalculation = require('./aabb-contact-calculation');

var aabbContactCalculation = _interopRequireWildcard(_aabbContactCalculation);

function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) {
    return obj;
  } else {
    var newObj = {};if (obj != null) {
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
      }
    }newObj.default = obj;return newObj;
  }
}

function _toConsumableArray(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
      arr2[i] = arr[i];
    }return arr2;
  } else {
    return Array.from(arr);
  }
} /**
   * This module defines utility methods for calculating a contact point between oriented bounding
   * boxes and other shapes.
   *
   * - Each of these functions assumes that the objects are actually colliding.
   * - The resulting contact point may be anywhere within the intersection of the two objects.
   */

// TODO: There are more efficient (but far more complicated) algorithms for finding the point of
// intersection with OBBs. Port over some other pre-existing solutions for these.

/**
 * @param {vec3} contactPoint Output param.
 * @param {vec3} contactNormal Output param.
 * @param {Obb} obb
 * @param {vec3} point
 */
function obbVsPoint(contactPoint, contactNormal, obb, point) {
  vec3.copy(contactPoint, point);
  findObbNormalFromContactPoint(contactNormal, contactPoint, obb);
}

/**
 * Finds the closest point anywhere inside the OBB to the center of the sphere.
 *
 * @param {vec3} contactPoint Output param.
 * @param {vec3} contactNormal Output param.
 * @param {Obb} obb
 * @param {Sphere} sphere
 */
function obbVsSphere(contactPoint, contactNormal, obb, sphere) {
  (0, _util.findClosestPointFromObbToPoint)(contactPoint, obb, sphere.centerOfVolume);
  vec3.subtract(contactNormal, sphere.centerOfVolume, contactPoint);
  vec3.normalize(contactNormal, contactNormal);
}

/**
 * NOTE: This implementation cheats by checking whether vertices from one shape lie within the
 * other. Due to the tunnelling problem, it is possible that intersection occurs without any
 * vertices lying within the other shape. However, (A) this is unlikely, and (B) we are ignoring the
 * tunnelling problem for the rest of this collision system anyway.
 *
 * @param {vec3} contactPoint Output param.
 * @param {vec3} contactNormal Output param.
 * @param {Obb} obb
 * @param {Aabb} aabb
 */
function obbVsAabb(contactPoint, contactNormal, obb, aabb) {
  return _obbVsBoxHelper(contactPoint, contactNormal, obb, aabb, _collisionDetection.aabbCollisionDetection.aabbVsPoint, aabbContactCalculation.findAabbNormalFromContactPoint);
}

/**
 * NOTE: This implementation cheats by checking whether vertices from one shape lie within the
 * other. Due to the tunnelling problem, it is possible that intersection occurs without any
 * vertices lying within the other shape. However, (A) this is unlikely, and (B) we are ignoring the
 * tunnelling problem for the rest of this collision system anyway.
 *
 * @param {vec3} contactPoint Output param.
 * @param {vec3} contactNormal Output param.
 * @param {Obb} obbA
 * @param {Obb} obbB
 */
function obbVsObb(contactPoint, contactNormal, obbA, obbB) {
  return _obbVsBoxHelper(contactPoint, contactNormal, obbA, obbB, _collisionDetection.obbCollisionDetection.obbVsPoint, findObbNormalFromContactPoint);
}

/**
 * @param {vec3} contactPoint Output param.
 * @param {vec3} contactNormal Output param.
 * @param {Obb} obb
 * @param {Obb|Aabb} other
 * @param {Function} otherVsPointCollisionDetectionCallback
 * @param {Function} findOtherNormalFromContactPoint
 * @private
 */
function _obbVsBoxHelper(contactPoint, contactNormal, obb, other, otherVsPointCollisionDetectionCallback, findOtherNormalFromContactPoint) {
  // Check whether any vertices from A lie within B's bounds.
  if (obb.someVertex(function (vertex) {
    return otherVsPointCollisionDetectionCallback(other, vertex);
  }, contactPoint)) {
    findOtherNormalFromContactPoint(contactNormal, contactPoint, other);
    vec3.negate(contactNormal, contactNormal);
    return;
  }

  // Check whether any vertices from B lie within A's bounds.
  if (other.someVertex(function (vertex) {
    return _collisionDetection.obbCollisionDetection.obbVsPoint(obb, vertex);
  }, contactPoint)) {
    findObbNormalFromContactPoint(contactNormal, contactPoint, obb);
    return;
  }

  // We assume that a vertex-to-face collision would have been detected by one of the two above
  // checks. Any edge-to-edge collision must involve both an edge from A through a face of B and
  // vice versa. So it is sufficient to only check the edges of one and the faces of the other.
  other.someEdge(function (edge) {
    return obb.someFace(function (face) {
      return _util.findPoiBetweenSegmentAndPlaneRegion.apply(undefined, [contactPoint, edge].concat(_toConsumableArray(face)));
    });
  });
  findObbNormalFromContactPoint(contactNormal, contactPoint, obb);
}

/**
 * @param {vec3} contactPoint Output param.
 * @param {vec3} contactNormal Output param.
 * @param {Obb} obb
 * @param {Capsule} capsule
 */
function obbVsCapsule(contactPoint, contactNormal, obb, capsule) {
  // tmpVec1 is the point on the capsule segment that is closest to the OBB.

  //
  // Check the edges.
  //

  var segment = new _collidables.LineSegment(vec3.create(), vec3.create());
  var squaredRadius = capsule.radius * capsule.radius;
  var areIntersecting = obb.someEdge(function (edge) {
    return (0, _util.findSquaredDistanceBetweenSegments)(capsule.segment, edge) < squaredRadius;
  }, segment);

  if (areIntersecting) {
    (0, _util.findClosestPointsFromSegmentToSegment)(_util.tmpVec1, contactPoint, capsule.segment, segment);
    vec3.subtract(contactNormal, _util.tmpVec1, contactPoint);
    vec3.normalize(contactNormal, contactNormal);
    return;
  }

  //
  // Check the faces.
  //

  obb.somePushedOutFace(function (face) {
    return _util.findPoiBetweenSegmentAndPlaneRegion.apply(undefined, [_util.tmpVec1, capsule.segment].concat(_toConsumableArray(face)));
  }, capsule.radius);

  findObbNormalFromContactPoint(contactNormal, _util.tmpVec1, obb);

  // NOTE: This assumes that the angle between the capsule segment and the face plane is not oblique
  // and that the depth of penetration is shallow. When both of these conditions are not true, the
  // contact point will be offset from the intersection point on the pushed-out face.
  vec3.scaleAndAdd(contactPoint, _util.tmpVec1, contactNormal, -capsule.radius);
}

/**
 * @param {vec3} contactNormal Output param.
 * @param {vec3} contactPoint
 * @param {Obb} obb
 * @private
 */
function findObbNormalFromContactPoint(contactNormal, contactPoint, obb) {
  // Calculate the displacement along each axis.
  var projections = [];
  vec3.subtract(_util.tmpVec1, contactPoint, obb.centerOfVolume);
  for (var i = 0; i < 3; i++) {
    projections[i] = vec3.dot(obb.axes[i], _util.tmpVec1);
  }

  // Determine which face the normal is pointing away from.
  vec3.set(contactNormal, 0, 0, 0);
  var xDistanceFromFace = obb.halfSideLengths[0] - Math.abs(projections[0]);
  var yDistanceFromFace = obb.halfSideLengths[1] - Math.abs(projections[1]);
  var zDistanceFromFace = obb.halfSideLengths[2] - Math.abs(projections[2]);
  // Assume that the point is contacting whichever face it's closest to.
  if (xDistanceFromFace <= yDistanceFromFace) {
    if (xDistanceFromFace <= zDistanceFromFace) {
      contactNormal[0] = projections[0] > 0 ? 1 : -1;
    } else {
      contactNormal[2] = projections[2] > 0 ? 1 : -1;
    }
  } else {
    if (yDistanceFromFace <= zDistanceFromFace) {
      contactNormal[1] = projections[1] > 0 ? 1 : -1;
    } else {
      contactNormal[2] = projections[2] > 0 ? 1 : -1;
    }
  }

  // Apply the OBB's orientation to the normal.
  vec3.transformQuat(contactNormal, contactNormal, obb.orientation);
}

exports.obbVsPoint = obbVsPoint;
exports.obbVsSphere = obbVsSphere;
exports.obbVsAabb = obbVsAabb;
exports.obbVsObb = obbVsObb;
exports.obbVsCapsule = obbVsCapsule;
exports.findObbNormalFromContactPoint = findObbNormalFromContactPoint;

},{"../../../util":39,"../../collidables":9,"../../collision-detection":16,"./aabb-contact-calculation":22}],25:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sphereVsCapsule = exports.sphereVsObb = exports.sphereVsAabb = exports.sphereVsSphere = exports.sphereVsPoint = undefined;

var _util = require('../../../util');

var _aabbContactCalculation = require('./aabb-contact-calculation');

var _obbContactCalculation = require('./obb-contact-calculation');

var obbContactCalculation = _interopRequireWildcard(_obbContactCalculation);

var _capsuleContactCalculation = require('./capsule-contact-calculation');

var capsuleContactCalculation = _interopRequireWildcard(_capsuleContactCalculation);

function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) {
    return obj;
  } else {
    var newObj = {};if (obj != null) {
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
      }
    }newObj.default = obj;return newObj;
  }
}

/**
 * @param {vec3} contactPoint Output param.
 * @param {vec3} contactNormal Output param.
 * @param {Sphere} sphere
 * @param {vec3} point
 */
/**
 * This module defines utility methods for calculating a contact point between spheres and other
 * shapes.
 *
 * - Each of these functions assumes that the objects are actually colliding.
 * - The resulting contact point may be anywhere within the intersection of the two objects.
 */

function sphereVsPoint(contactPoint, contactNormal, sphere, point) {
  vec3.copy(contactPoint, point);
  // Assume that the point is contacting the closest point on the surface of the sphere.
  vec3.subtract(contactNormal, point, sphere.centerOfVolume);
  vec3.normalize(contactNormal, contactNormal);
}

/**
 * @param {vec3} contactPoint Output param.
 * @param {vec3} contactNormal Output param.
 * @param {Sphere} sphereA
 * @param {Sphere} sphereB
 */
function sphereVsSphere(contactPoint, contactNormal, sphereA, sphereB) {
  vec3.subtract(contactNormal, sphereB.centerOfVolume, sphereA.centerOfVolume);
  vec3.normalize(contactNormal, contactNormal);
  // The point on the surface of sphere A that is closest to the center of sphere B.
  vec3.scaleAndAdd(contactPoint, sphereA.centerOfVolume, contactNormal, sphereA.radius);
}

/**
 * Finds the closest point on the surface of the AABB to the sphere center.
 *
 * @param {vec3} contactPoint Output param.
 * @param {vec3} contactNormal Output param.
 * @param {Sphere} sphere
 * @param {Aabb} aabb
 */
function sphereVsAabb(contactPoint, contactNormal, sphere, aabb) {
  (0, _util.findClosestPointFromAabbSurfaceToPoint)(contactPoint, aabb, sphere.centerOfVolume);
  (0, _aabbContactCalculation.findAabbNormalFromContactPoint)(contactNormal, contactPoint, aabb);
  vec3.negate(contactNormal, contactNormal);
}

/**
 * @param {vec3} contactPoint Output param.
 * @param {vec3} contactNormal Output param.
 * @param {Sphere} sphere
 * @param {Obb} obb
 */
function sphereVsObb(contactPoint, contactNormal, sphere, obb) {
  obbContactCalculation.obbVsSphere(contactPoint, contactNormal, obb, sphere);
  vec3.negate(contactNormal, contactNormal);
}

/**
 * @param {vec3} contactPoint Output param.
 * @param {vec3} contactNormal Output param.
 * @param {Sphere} sphere
 * @param {Capsule} capsule
 */
function sphereVsCapsule(contactPoint, contactNormal, sphere, capsule) {
  capsuleContactCalculation.capsuleVsSphere(contactPoint, contactNormal, capsule, sphere);
  vec3.negate(contactNormal, contactNormal);
}

exports.sphereVsPoint = sphereVsPoint;
exports.sphereVsSphere = sphereVsSphere;
exports.sphereVsAabb = sphereVsAabb;
exports.sphereVsObb = sphereVsObb;
exports.sphereVsCapsule = sphereVsCapsule;

},{"../../../util":39,"./aabb-contact-calculation":22,"./capsule-contact-calculation":23,"./obb-contact-calculation":24}],26:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _collidables = require('./collidables');

Object.keys(_collidables).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _collidables[key];
    }
  });
});

var _collisionDetection = require('./collision-detection');

Object.keys(_collisionDetection).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _collisionDetection[key];
    }
  });
});

var _contactCalculation = require('./contact-calculation');

Object.keys(_contactCalculation).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _contactCalculation[key];
    }
  });
});

var _collidableFactories = require('./src/collidable-factories');

Object.keys(_collidableFactories).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _collidableFactories[key];
    }
  });
});

var _collidablePhysicsJob = require('./src/collidable-physics-job');

Object.keys(_collidablePhysicsJob).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _collidablePhysicsJob[key];
    }
  });
});

var _collidableStore = require('./src/collidable-store');

Object.keys(_collidableStore).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _collidableStore[key];
    }
  });
});

var _collisionHandler = require('./src/collision-handler');

Object.keys(_collisionHandler).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _collisionHandler[key];
    }
  });
});

var _collisionUtils = require('./src/collision-utils');

Object.keys(_collisionUtils).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _collisionUtils[key];
    }
  });
});

},{"./collidables":9,"./collision-detection":16,"./contact-calculation":21,"./src/collidable-factories":27,"./src/collidable-physics-job":28,"./src/collidable-store":29,"./src/collision-handler":30,"./src/collision-utils":31}],27:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createSphereOrCapsuleFromRenderableShape = exports.createSphereFromRenderableShape = exports.createObbFromRenderableShape = exports.createCollidableFromRenderableShape = exports.createCapsuleFromRenderableShape = undefined;

var _collidables = require('../collidables');

var _util = require('../../util');

/**
 * @param {CollidableShapeConfig} params
 * @param {CollidablePhysicsJob} [physicsJob]
 * @returns {Collidable}
 */
/**
 * This module defines a set of factory functions for creating Collidable instances.
 */

function createCollidableFromRenderableShape(params, physicsJob) {
  return _collidableCreators[params.collidableShapeId](params, physicsJob);
}

/**
 * This assumes the base RenderableShape has a side length of one unit.
 *
 * @param {CollidableShapeConfig} params
 * @param {CollidablePhysicsJob} [physicsJob]
 * @returns {Collidable}
 */
function createObbFromRenderableShape(params, physicsJob) {
  var halfRangeX = params.scale[0] / 2;
  var halfRangeY = params.scale[1] / 2;
  var halfRangeZ = params.scale[2] / 2;
  return new _collidables.Obb(halfRangeX, halfRangeY, halfRangeZ, params.isStationary, physicsJob);
}

/**
 * This assumes the base RenderableShape has a "radius" of one unit.
 *
 * @param {CollidableShapeConfig} params
 * @param {CollidablePhysicsJob} [physicsJob]
 * @returns {Collidable}
 */
function createSphereFromRenderableShape(params, physicsJob) {
  var radius = params.radius || vec3.length(params.scale) / Math.sqrt(3);
  return new _collidables.Sphere(0, 0, 0, radius, params.isStationary, physicsJob);
}

/**
 * The radius of the created capsule will be an average from the two shortest sides.
 *
 * There are two modes: either we use scale, or we use radius and capsuleEndPointsDistance.
 *
 * @param {CollidableShapeConfig} params
 * @param {CollidablePhysicsJob} [physicsJob]
 * @returns {Collidable}
 */
function createCapsuleFromRenderableShape(params, physicsJob) {
  var scale = params.scale;
  var capsuleEndPointsDistance = params.capsuleEndPointsDistance;
  var isStationary = params.isStationary;
  var radius = params.radius;

  var halfDistance = void 0;

  // There are two modes: either we use scale, or we use radius and capsuleEndPointsDistance.
  if (typeof radius === 'number' && typeof capsuleEndPointsDistance === 'number') {
    halfDistance = capsuleEndPointsDistance / 2;
  } else {
    var copy = vec3.clone(scale);
    copy.sort();

    var length = copy[2];
    radius = (copy[0] + copy[1]) / 2;
    halfDistance = length / 2 - radius;
  }

  var orientation = quat.create();
  if (scale[0] > scale[1]) {
    if (scale[0] > scale[2]) {
      vec3.rotateY(orientation, orientation, _util._geometry.HALF_PI);
    } else {
      // Do nothing; the capsule defaults to being aligned with the z-axis.
    }
  } else {
    if (scale[1] > scale[2]) {
      vec3.rotateX(orientation, orientation, -_util._geometry.HALF_PI);
    } else {
      // Do nothing; the capsule defaults to being aligned with the z-axis.
    }
  }

  var capsule = new _collidables.Capsule(halfDistance, radius, isStationary, physicsJob);
  capsule.orientation = orientation;

  return capsule;
}

/**
 * @param {CollidableShapeConfig} params
 * @param {CollidablePhysicsJob} [physicsJob]
 * @returns {Collidable}
 */
function createSphereOrCapsuleFromRenderableShape(params, physicsJob) {
  var scale = params.scale;
  var radius = params.radius;
  var capsuleEndPointsDistance = params.capsuleEndPointsDistance;

  var halfLengthX = scale[0] * radius;
  var halfLengthY = scale[1] * radius;
  var halfLengthZ = scale[2] * (radius + capsuleEndPointsDistance) / 2;

  var minLength = Math.min(Math.min(halfLengthX, halfLengthY), halfLengthZ);
  var maxLength = Math.max(Math.max(halfLengthX, halfLengthY), halfLengthZ);

  if (maxLength / minLength >= _SPHERE_VS_CAPSULE_ASPECT_RATIO_THRESHOLD) {
    return createCapsuleFromRenderableShape(params, physicsJob);
  } else {
    return createSphereFromRenderableShape(params, physicsJob);
  }
}

var _SPHERE_VS_CAPSULE_ASPECT_RATIO_THRESHOLD = 2;

var _collidableCreators = {
  'CUBE': createObbFromRenderableShape,
  'SPHERE_OR_CAPSULE': createSphereOrCapsuleFromRenderableShape,
  'SPHERE': createSphereFromRenderableShape,
  'CAPSULE': createCapsuleFromRenderableShape
};

exports.createCapsuleFromRenderableShape = createCapsuleFromRenderableShape;
exports.createCollidableFromRenderableShape = createCollidableFromRenderableShape;
exports.createObbFromRenderableShape = createObbFromRenderableShape;
exports.createSphereFromRenderableShape = createSphereFromRenderableShape;
exports.createSphereOrCapsuleFromRenderableShape = createSphereOrCapsuleFromRenderableShape;

/**
 * @typedef {Object} CollidableShapeConfig
 * @property {string} collidableShapeId The ID of the type of collidable shape.
 * @property {vec3} [scale]
 * @property {boolean} [isStationary=false] Whether the collidable is fixed in place.
 */

/**
 * @typedef {CollidableShapeConfig} SphericalCollidableShapeParams
 * @property {number} radius
 */

/**
 * @typedef {SphericalCollidableShapeParams} CapsuleCollidableShapeParams
 * @property {number} capsuleEndPointsDistance The distance between the centers of the spheres on either end
 * of the capsule.
 */

},{"../../util":39,"../collidables":9}],28:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CollidablePhysicsJob = undefined;

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _get = function get(object, property, receiver) {
  if (object === null) object = Function.prototype;var desc = Object.getOwnPropertyDescriptor(object, property);if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);if (parent === null) {
      return undefined;
    } else {
      return get(parent, property, receiver);
    }
  } else if ("value" in desc) {
    return desc.value;
  } else {
    var getter = desc.get;if (getter === undefined) {
      return undefined;
    }return getter.call(receiver);
  }
};

var _collidableFactories = require('./collidable-factories');

var _collidableStore = require('./collidable-store');

var _physicsJob = require('../../src/physics-job');

var _util = require('../../util');

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && ((typeof call === "undefined" ? "undefined" : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === "undefined" ? "undefined" : _typeof(superClass)));
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

/**
 * A CollidablePhysicsJob extends the standard PhysicsJob with a collidable geometry.
 */
var CollidablePhysicsJob = function (_PhysicsJob) {
  _inherits(CollidablePhysicsJob, _PhysicsJob);

  /**
   * @param {CollidableShapeConfig} collidableParams
   * @param {PhysicsState} state
   * @param {Array.<ForceApplier>} forceAppliers
   * @param {Object} controller
   * @param {CollisionHandler} collisionHandler
   */
  function CollidablePhysicsJob(collidableParams, state, forceAppliers, controller, collisionHandler) {
    _classCallCheck(this, CollidablePhysicsJob);

    var _this = _possibleConstructorReturn(this, (CollidablePhysicsJob.__proto__ || Object.getPrototypeOf(CollidablePhysicsJob)).call(this, forceAppliers, state));

    collidableParams.scale = collidableParams.scale || vec3.fromValues(1, 1, 1);
    _this.collidable = (0, _collidableFactories.createCollidableFromRenderableShape)(collidableParams, _this);
    _this.currentState.unrotatedInertiaTensor = (0, _util.createForCollidable)(_this.collidable, _this.currentState.mass);
    _this.currentState.updateDependentFields();
    _this.isAtRest = false;
    _this.controller = controller;
    _this._collisionHandler = collisionHandler;
    return _this;
  }

  /**
   * @param {ForceApplier} forceApplier
   */

  _createClass(CollidablePhysicsJob, [{
    key: 'addForceApplier',
    value: function addForceApplier(forceApplier) {
      _get(CollidablePhysicsJob.prototype.__proto__ || Object.getPrototypeOf(CollidablePhysicsJob.prototype), 'addForceApplier', this).call(this, forceApplier);
      this.isAtRest = false;
    }

    /**
     * @param {ForceApplier} forceApplier
     */

  }, {
    key: 'removeForceApplier',
    value: function removeForceApplier(forceApplier) {
      _get(CollidablePhysicsJob.prototype.__proto__ || Object.getPrototypeOf(CollidablePhysicsJob.prototype), 'removeForceApplier', this).call(this, forceApplier);
      this.isAtRest = false;
    }

    /**
     * This callback is triggered in response to a collision.
     *
     * @param {Collision} collision
     * @returns {boolean} True if this needs the standard collision restitution to proceed.
     */

  }, {
    key: 'handleCollision',
    value: function handleCollision(collision) {
      return this._collisionHandler(collision);
    }

    /**
     * @param {number} [startTime]
     * @override
     */

  }, {
    key: 'start',
    value: function start(startTime) {
      _get(CollidablePhysicsJob.prototype.__proto__ || Object.getPrototypeOf(CollidablePhysicsJob.prototype), 'start', this).call(this, startTime);
      _collidableStore.collidableStore.registerCollidable(this.collidable);
    }

    /**
     * @override
     */

  }, {
    key: 'finish',
    value: function finish() {
      _get(CollidablePhysicsJob.prototype.__proto__ || Object.getPrototypeOf(CollidablePhysicsJob.prototype), 'finish', this).call(this);
      _collidableStore.collidableStore.unregisterCollidable(this.collidable);
    }

    /** @returns {vec3} */

  }, {
    key: 'position',
    get: function get() {
      return this.currentState.position;
    }

    /** @param {vec3} value */

    , set: function set(value) {
      this.currentState.position = vec3.clone(value);
      this.collidable.position = vec3.clone(value);
    }
  }]);

  return CollidablePhysicsJob;
}(_physicsJob.PhysicsJob);

exports.CollidablePhysicsJob = CollidablePhysicsJob;

/**
 * @typedef {Function} CollisionHandler
 * @param {Collision} collision
 * @returns {boolean} True if this needs the standard collision restitution to proceed.
 */

},{"../../src/physics-job":37,"../../util":39,"./collidable-factories":27,"./collidable-store":29}],29:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.collidableStore = undefined;

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _collisionUtils = require('./collision-utils');

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

// TODO: Implement some form of bounding volume hierarchy to make searching for potential collisions
// more efficient.

/**
 * This class registers and retrieves all Collidables within a scene.
 */
var CollidableStore = function () {
  function CollidableStore() {
    _classCallCheck(this, CollidableStore);

    this._collidables = [];
  }

  /**
   * Caches the given program wrapper.
   *
   * This method is idempotent; a given program will only be cached once.
   *
   * @param {Collidable} collidable
   */

  _createClass(CollidableStore, [{
    key: 'registerCollidable',
    value: function registerCollidable(collidable) {
      this._collidables.push(collidable);
    }

    /**
     * @param {Collidable} collidable
     */

  }, {
    key: 'unregisterCollidable',
    value: function unregisterCollidable(collidable) {
      var index = this._collidables.indexOf(collidable);
      if (index >= 0) {
        this._collidables.splice(index, 1);
      }
    }

    /**
     * @param {Collidable} collidable
     * @returns {Array.<Collidable>}
     */

  }, {
    key: 'getPossibleCollisionsForCollidable',
    value: function getPossibleCollisionsForCollidable(collidable) {
      return this._collidables.filter(function (other) {
        return collidable !== other && (0, _collisionUtils.detectBoundingVolumeIntersection)(collidable, other);
      });
    }

    /**
     * @returns {Array.<Collision>}
     */

  }, {
    key: 'getPossibleCollisionsForAllCollidables',
    value: function getPossibleCollisionsForAllCollidables() {
      var result = [];
      for (var i = 0, count = this._collidables.length; i < count; i++) {
        var collidableA = this._collidables[i];
        for (var j = i + 1; j < count; j++) {
          var collidableB = this._collidables[j];
          if ((0, _collisionUtils.detectBoundingVolumeIntersection)(collidableA, collidableB)) {
            result.push({ collidableA: collidableA, collidableB: collidableB });
          }
        }
      }
      return result;
    }

    /**
     * @param {Function} callback
     */

  }, {
    key: 'forEach',
    value: function forEach(callback) {
      this._collidables.forEach(callback);
    }
  }]);

  return CollidableStore;
}();

var collidableStore = new CollidableStore();
exports.collidableStore = collidableStore;

/**
 * @typedef {Object} Collision
 * @property {Collidable} collidableA
 * @property {Collidable} collidableB
 * @property {vec3} [contactPoint] In world coordinates.
 * @property {vec3} [contactNormal] Points away from body A and toward body B.
 * @property {number} [time]
 */

},{"./collision-utils":31}],30:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getOtherControllerFromCollision = exports.checkThatNoObjectsCollide = exports.recordOldCollisionsForDevModeForAllCollidables = exports.determineJobsAtRest = exports.findIntersectingCollidablesForCollidable = exports.handleCollisionsForJob = undefined;

var _util = require('../../util');

var _collidableStore = require('./collidable-store');

var _collisionUtils = require('./collision-utils');

/**
 * This module defines a collision pipeline.
 *
 * These functions will detect collisions between collidable bodies and update their momenta in
 * response to the collisions.
 *
 * - Consists of an efficient broad-phase collision detection step followed by a precise
 *   narrow-phase step.
 * - Calculates the position, surface normal, and time of each contact.
 * - Calculates the impulse of a collision and updates the bodies' linear and angular momenta in
 *   response.
 * - Applies Coulomb friction to colliding bodies.
 * - Sub-divides the time step to more precisely determine when and where a collision occurs.
 * - Supports multiple collisions with a single body in a single time step.
 * - Efficiently supports bodies coming to rest against each other.
 * - Bodies will never penetrate one another.
 * - This does not address the tunnelling problem. That is, it is possible for two fast-moving
 *   bodies to pass through each other as long as they did not intersect each other during any time
 *   step.
 * - This only supports collisions between certain types of shapes. Fortunately, this set provides
 *   reasonable approximations for most other shapes. The supported types of shapes are: spheres,
 *   capsules, AABBs, and OBBs.
 *
 * ## Objects that come to rest
 *
 * An important efficiency improvement is to not process objects through the physics engine pipeline
 * after they have come to rest. The isAtRest field indicates when a body has come to rest.
 *
 * isAtRest is set to true after a physics frame is finished if the collisions, forces, position,
 * and orientation of a job have not changed from the previous to the current state.
 *
 * isAtRest is set to false from two possible events: after a physics frame is finished if the
 * collisions have changed from the previous to the current state, or when a force is added to
 * removed from the job.
 *
 * ## Collision calculations do not consider velocity
 *
 * Collision detection works by waiting until two bodies intersect. However, because time frames are
 * not infinitely small, when an intersection is detected, it's already past the exact instance of
 * collision. To alleviate problems from this, the velocity of each body can be considered when
 * calculating the collision time, position, and contact normal. However, taking velocity into
 * account makes the contact calculations much more complex, so we do not consider velocity in our
 * calculations.
 *
 * A notable consequence of this is that the calculated contact normals can be incorrect. Consider
 * the following moving squares. At time t2 they are found to have collided. The calculated contact
 * point will be somewhere within the intersection of the corners. But the calculated contact normal
 * will point upwards, while the true contact normal should point to the right. This is because the
 * contact calculations do not consider velocity and instead only consider the shallowest direction
 * of overlap.
 *
 * // Time t1
 *                    +------------+
 *                    |            |
 *                    |            |
 *                <-- |      B     |
 *                    |            |
 *  +------------+    |            |
 *  |            |    +------------+
 *  |            |
 *  |      A     | -->
 *  |            |
 *  |            |
 *  +------------+
 *
 * // Time t2
 *         +------------+
 *         |            |
 *         |            |
 *         |      B     |
 *         |            |
 *  +------------+      |
 *  |      +-----|------+
 *  |            |
 *  |      A     |
 *  |            |
 *  |            |
 *  +------------+
 */

/**
 * Detect and handle any collisions between a given job and all other collidable bodies.
 *
 * @param {CollidablePhysicsJob} job
 * @param {DOMHighResTimeStamp} elapsedTime
 * @param {PhysicsConfig} physicsParams
 */
function handleCollisionsForJob(job, elapsedTime, physicsParams) {
  var collidable = job.collidable;

  // Clear any previous collision info.
  collidable.previousCollisions = collidable.collisions;
  collidable.collisions = [];

  // Find all colliding collidables.
  var collidingCollidables = findIntersectingCollidablesForCollidable(collidable);

  // Store the time of collision for each collision.
  var collisions = _recordCollisions(collidable, collidingCollidables, elapsedTime);

  // Calculate the points of contact for each collision.
  _calculatePointsOfContact(collisions);

  // Collision resolution.
  _resolveCollisions(collisions, physicsParams);
}

/**
 * Finds all other collidables that intersect with the given collidable.
 *
 * @param {Collidable} collidable
 * @returns {Array.<Collidable>}
 */
function findIntersectingCollidablesForCollidable(collidable) {
  // Broad-phase collision detection (pairs whose bounding volumes intersect).
  var collidingCollidables = _collidableStore.collidableStore.getPossibleCollisionsForCollidable(collidable);

  // Narrow-phase collision detection (pairs that actually intersect).
  return _detectPreciseCollisionsFromCollidingCollidables(collidable, collidingCollidables);
}

/**
 * @param {Array.<CollidablePhysicsJob>} jobs
 */
function determineJobsAtRest(jobs) {
  jobs.forEach(function (job) {
    return job.isAtRest = _isJobAtRest(job);
  });
}

function recordOldCollisionsForDevModeForAllCollidables() {
  _collidableStore.collidableStore.forEach(_recordOldCollisionsForDevModeForCollidable);
}

/**
 * Logs a warning message for any pair of objects that intersect.
 */
function checkThatNoObjectsCollide() {
  // Broad-phase collision detection (pairs whose bounding volumes intersect).
  var collisions = _collidableStore.collidableStore.getPossibleCollisionsForAllCollidables();

  // Narrow-phase collision detection (pairs that actually intersect).
  collisions = _detectPreciseCollisionsFromCollisions(collisions);

  collisions.forEach(function (collision) {
    console.warn('Objects still intersect after collision resolution', collision);
  });
}

/**
 * Create collision objects that record the time of collision and the collidables in the collision.
 *
 * Also record references to these collisions on the collidables.
 *
 * @param {Collidable} collidable
 * @param {Array.<Collidable>} collidingCollidables
 * @param {DOMHighResTimeStamp} elapsedTime
 * @returns {Array.<Collision>}
 * @private
 */
function _recordCollisions(collidable, collidingCollidables, elapsedTime) {
  return collidingCollidables.map(function (other) {
    var collision = {
      collidableA: collidable,
      collidableB: other,
      time: elapsedTime
    };

    // Record the fact that these objects collided (the ModelController may want to handle this).
    collision.collidableA.collisions.push(collision);
    collision.collidableB.collisions.push(collision);

    return collision;
  });
}

/**
 * Narrow-phase collision detection.
 *
 * Given a list of possible collision pairs, filter out which pairs are actually colliding.
 *
 * @param {Array.<Collision>} collisions
 * @returns {Array.<Collision>}
 * @private
 */
function _detectPreciseCollisionsFromCollisions(collisions) {
  return collisions.filter(function (collision) {
    // TODO:
    // - Use temporal bisection with discrete sub-time steps to find time of collision (use
    //       x-vs-y-specific intersection detection methods).
    // - Make sure the collision object is set up with the "previousState" from the sub-step
    //   before collision and the time from the sub-step after collision (determined from the
    //   previous temporal bisection search...)

    return (0, _collisionUtils.detectIntersection)(collision.collidableA, collision.collidableB);
  });
}

/**
 * Narrow-phase collision detection.
 *
 * Given a list of possible collision pairs, filter out which pairs are actually colliding.
 *
 * @param {Collidable} collidable
 * @param {Array.<Collidable>} collidingCollidables
 * @returns {Array.<Collidable>}
 * @private
 */
function _detectPreciseCollisionsFromCollidingCollidables(collidable, collidingCollidables) {
  return collidingCollidables.filter(function (other) {
    // TODO:
    // - Use temporal bisection with discrete sub-time steps to find time of collision (use
    //       x-vs-y-specific intersection detection methods).
    // - Make sure the collision object is set up with the "previousState" from the sub-step
    //   before collision and the time from the sub-step after collision (determined from the
    //   previous temporal bisection search...)

    return (0, _collisionUtils.detectIntersection)(collidable, other);
  });
}

/**
 * Calculate the intersection position and contact normal of each collision.
 *
 * @param {Array.<Collision>} collisions
 * @private
 */
function _calculatePointsOfContact(collisions) {
  collisions.forEach(_collisionUtils.calculateContact);
}

/**
 * Updates the linear and angular momenta of each body in response to its collision.
 *
 * @param {Array.<Collision>} collisions
 * @param {PhysicsConfig} physicsParams
 * @private
 */
function _resolveCollisions(collisions, physicsParams) {
  collisions.forEach(function (collision) {
    // If neither physics job needs the standard collision restitution, then don't do it.
    if (_notifyPhysicsJobsOfCollision(collision)) {
      if (collision.collidableA.physicsJob && collision.collidableB.physicsJob) {
        // Neither of the collidables is stationary.
        _resolveCollision(collision, physicsParams);
      } else {
        // One of the two collidables is stationary.
        _resolveCollisionWithStationaryObject(collision, physicsParams);
      }
    }
  });
}

/**
 * @param {Collision} collision
 * @returns {boolean} True if one of the PhysicsJobs need the standard collision restitution to
 * proceed.
 * @private
 */
function _notifyPhysicsJobsOfCollision(collision) {
  return collision.collidableA.physicsJob.handleCollision(collision) || collision.collidableB.physicsJob.handleCollision(collision);
}

/**
 * Resolve a collision between two moving, physics-based objects.
 *
 * This is based on collision-response algorithms from Wikipedia
 * (https://en.wikipedia.org/wiki/Collision_response#Impulse-based_reaction_model).
 *
 * @param {Collision} collision
 * @param {PhysicsConfig} physicsParams
 * @private
 */
function _resolveCollision(collision, physicsParams) {
  var collidableA = collision.collidableA;
  var collidableB = collision.collidableB;
  var previousStateA = collidableA.physicsJob.previousState;
  var previousStateB = collidableB.physicsJob.previousState;
  var nextStateA = collidableA.physicsJob.currentState;
  var nextStateB = collidableB.physicsJob.currentState;
  var centerA = collidableA.centerOfMass;
  var centerB = collidableB.centerOfMass;
  var contactPoint = collision.contactPoint;

  var contactPointOffsetA = _util.tmpVec3;
  vec3.subtract(contactPointOffsetA, contactPoint, centerA);
  var contactPointOffsetB = _util.tmpVec4;
  vec3.subtract(contactPointOffsetB, contactPoint, centerB);

  //
  // Calculate the relative velocity of the bodies at the point of contact.
  //
  // We use the velocity from the previous state, since it is the velocity that led to the
  // collision.
  //

  var velocityA = _util.tmpVec1;
  vec3.cross(_util.tmpVec1, previousStateA.angularVelocity, contactPointOffsetA);
  vec3.add(velocityA, previousStateA.velocity, _util.tmpVec1);

  var velocityB = _util.tmpVec2;
  vec3.cross(_util.tmpVec2, previousStateB.angularVelocity, contactPointOffsetB);
  vec3.add(velocityB, previousStateB.velocity, _util.tmpVec2);

  var relativeVelocity = vec3.create();
  vec3.subtract(relativeVelocity, velocityB, velocityA);

  if (vec3.dot(relativeVelocity, collision.contactNormal) >= 0) {
    // If the relative velocity is not pointing against the normal, then the normal was calculated
    // incorrectly (this is likely due to the time step being too large and the fact that our
    // contact calculations don't consider velocity). So update the contact normal to be in the
    // direction of the relative velocity.

    // TODO: Check that this works as expected.

    // console.warn('Non-collision because objects are moving away from each other.');

    vec3.copy(collision.contactNormal, relativeVelocity);
    vec3.normalize(collision.contactNormal, collision.contactNormal);
    vec3.negate(collision.contactNormal, collision.contactNormal);
  }

  _applyImpulseFromCollision(collision, relativeVelocity, contactPointOffsetA, contactPointOffsetB, physicsParams);

  // NOTE: This state reversion is only applied to collidableA. This assumes that only A is moving
  // during this iteration of the collision pipeline.

  // Revert to the position and orientation from immediately before the collision.
  vec3.copy(nextStateA.position, previousStateA.position);
  quat.copy(nextStateA.orientation, previousStateA.orientation);

  // Also revert the collidables' position and orientation.
  collidableA.position = previousStateA.position;
  collidableA.orientation = previousStateA.orientation;

  nextStateA.updateDependentFields();
  nextStateB.updateDependentFields();
}

/**
 * Resolve a collision between one moving, physics-based object and one stationary object.
 *
 * @param {Collision} collision
 * @param {PhysicsConfig} physicsParams
 * @private
 */
function _resolveCollisionWithStationaryObject(collision, physicsParams) {
  var contactNormal = collision.contactNormal;

  var physicsCollidable = void 0;
  if (collision.collidableA.physicsJob) {
    physicsCollidable = collision.collidableA;
  } else {
    physicsCollidable = collision.collidableB;
    vec3.negate(contactNormal, contactNormal);
  }

  var previousState = physicsCollidable.physicsJob.previousState;
  var nextState = physicsCollidable.physicsJob.currentState;
  var center = physicsCollidable.centerOfMass;
  var contactPoint = collision.contactPoint;

  var contactPointOffset = _util.tmpVec3;
  vec3.subtract(contactPointOffset, contactPoint, center);

  // Calculate the relative velocity of the bodies at the point of contact. We use the velocity from
  // the previous state, since it is the velocity that led to the collision.
  var velocity = vec3.create();
  vec3.cross(_util.tmpVec1, previousState.angularVelocity, contactPointOffset);
  vec3.add(velocity, previousState.velocity, _util.tmpVec1);

  if (vec3.dot(velocity, contactNormal) <= 0) {
    // If the relative velocity is not pointing against the normal, then the normal was calculated
    // incorrectly (this is likely due to the time step being too large and the fact that our
    // contact calculations don't consider velocity). So update the contact normal to be in the
    // direction of the relative velocity.

    // TODO: Check that this works as expected.

    console.warn('Non-collision because object is moving away from stationary object.');

    vec3.copy(collision.contactNormal, velocity);
    vec3.normalize(collision.contactNormal, collision.contactNormal);
    vec3.negate(collision.contactNormal, collision.contactNormal);
  }

  _applyImpulseFromCollisionWithStationaryObject(physicsCollidable, collision, velocity, contactPointOffset, physicsParams);

  // Revert to the position and orientation from immediately before the collision.
  vec3.copy(nextState.position, previousState.position);
  quat.copy(nextState.orientation, previousState.orientation);

  // Also revert the collidable's position and orientation.
  physicsCollidable.position = previousState.position;
  physicsCollidable.orientation = previousState.orientation;

  nextState.updateDependentFields();
}

/**
 * This is based on collision-response algorithms from Wikipedia
 * (https://en.wikipedia.org/wiki/Collision_response#Impulse-based_reaction_model). This algorithm
 * has been simplified by assuming the stationary body has infinite mass and zero velocity.
 *
 * @param {Collision} collision
 * @param {vec3} relativeVelocity
 * @param {vec3} contactPointOffsetA
 * @param {vec3} contactPointOffsetB
 * @param {PhysicsConfig} physicsParams
 * @private
 */
function _applyImpulseFromCollision(collision, relativeVelocity, contactPointOffsetA, contactPointOffsetB, physicsParams) {
  var collidableA = collision.collidableA;
  var collidableB = collision.collidableB;

  var stateA = collidableA.physicsJob.currentState;
  var stateB = collidableB.physicsJob.currentState;

  var contactNormal = collision.contactNormal;

  //
  // Calculate and apply the main collision impulse.
  //

  vec3.scale(_util.tmpVec1, relativeVelocity, -(1 + physicsParams.coefficientOfRestitution));
  var numerator = vec3.dot(_util.tmpVec1, contactNormal);

  vec3.cross(_util.tmpVec1, contactPointOffsetA, contactNormal);
  vec3.transformMat3(_util.tmpVec1, _util.tmpVec1, stateA.inverseInertiaTensor);
  vec3.cross(_util.tmpVec1, _util.tmpVec1, contactPointOffsetA);

  vec3.cross(_util.tmpVec2, contactPointOffsetB, contactNormal);
  vec3.transformMat3(_util.tmpVec2, _util.tmpVec2, stateB.inverseInertiaTensor);
  vec3.cross(_util.tmpVec2, _util.tmpVec2, contactPointOffsetB);

  vec3.add(_util.tmpVec1, _util.tmpVec1, _util.tmpVec2);
  var denominator = vec3.dot(_util.tmpVec1, contactNormal) + stateA.inverseMass + stateB.inverseMass;

  var impulseMagnitude = numerator / denominator;

  _applyImpulse(stateA, -impulseMagnitude, contactNormal, contactPointOffsetA);
  _applyImpulse(stateB, impulseMagnitude, contactNormal, contactPointOffsetB);

  //
  // Calculate and apply a dynamic friction impulse.
  //

  var frictionImpulseMagnitude = impulseMagnitude * physicsParams.coefficientOfFriction;

  var tangent = _util.tmpVec2;
  vec3.scale(_util.tmpVec1, contactNormal, vec3.dot(relativeVelocity, contactNormal));
  vec3.subtract(tangent, relativeVelocity, _util.tmpVec1);
  vec3.normalize(tangent, tangent);

  _applyImpulse(stateA, frictionImpulseMagnitude, tangent, contactPointOffsetA);
  _applyImpulse(stateB, -frictionImpulseMagnitude, tangent, contactPointOffsetB);
}

/**
 * This is based on collision-response algorithms from Wikipedia
 * (https://en.wikipedia.org/wiki/Collision_response#Impulse-based_reaction_model). This algorithm
 * has been simplified by assuming the stationary body has infinite mass and zero velocity.
 *
 * @param {Collidable} physicsCollidable
 * @param {Collision} collision
 * @param {vec3} velocity
 * @param {vec3} contactPointOffset
 * @param {PhysicsConfig} physicsParams
 * @private
 */
function _applyImpulseFromCollisionWithStationaryObject(physicsCollidable, collision, velocity, contactPointOffset, physicsParams) {
  var state = physicsCollidable.physicsJob.currentState;
  var contactNormal = collision.contactNormal;

  //
  // Calculate and apply the main collision impulse.
  //

  vec3.scale(_util.tmpVec1, velocity, -(1 + physicsParams.coefficientOfRestitution));
  var numerator = vec3.dot(_util.tmpVec1, contactNormal);

  vec3.cross(_util.tmpVec1, contactPointOffset, contactNormal);
  vec3.transformMat3(_util.tmpVec1, _util.tmpVec1, state.inverseInertiaTensor);
  vec3.cross(_util.tmpVec1, _util.tmpVec1, contactPointOffset);
  var denominator = vec3.dot(_util.tmpVec1, contactNormal) + state.inverseMass;

  var impulseMagnitude = numerator / denominator;

  _applyImpulse(state, impulseMagnitude, contactNormal, contactPointOffset);

  //
  // Calculate and apply a dynamic friction impulse.
  //

  var frictionImpulseMagnitude = impulseMagnitude * physicsParams.coefficientOfFriction;

  var tangent = _util.tmpVec2;
  vec3.scale(_util.tmpVec1, contactNormal, vec3.dot(velocity, contactNormal));
  vec3.subtract(tangent, velocity, _util.tmpVec1);
  vec3.normalize(tangent, tangent);

  _applyImpulse(state, frictionImpulseMagnitude, tangent, contactPointOffset);
}

/**
 * @param {PhysicsState} state
 * @param {number} impulseMagnitude
 * @param {vec3} impulseDirection
 * @param {vec3} contactPointOffset
 * @private
 */
function _applyImpulse(state, impulseMagnitude, impulseDirection, contactPointOffset) {
  // Calculate the updated linear momenta.
  var finalLinearMomentum = vec3.create();
  vec3.scaleAndAdd(finalLinearMomentum, state.momentum, impulseDirection, impulseMagnitude);

  // Calculate the updated angular momenta.
  var finalAngularMomentum = vec3.create();
  vec3.cross(_util.tmpVec1, contactPointOffset, impulseDirection);
  vec3.scaleAndAdd(finalAngularMomentum, state.angularMomentum, _util.tmpVec1, impulseMagnitude);

  // Apply the updated momenta.
  vec3.copy(state.momentum, finalLinearMomentum);
  vec3.copy(state.angularMomentum, finalAngularMomentum);
}

/**
 * @param {CollidablePhysicsJob} job
 * @returns {boolean}
 * @private
 */
function _isJobAtRest(job) {
  return (0, _util.areVec3sClose)(job.currentState.position, job.previousState.position) && (0, _util.areVec3sClose)(job.currentState.velocity, job.previousState.velocity) && (0, _util.areVec3sClose)(job.currentState.orientation, job.previousState.orientation) && _doCollisionsMatch(job.collidable.collisions, job.collidable.previousCollisions);
}

/**
 * @param {Array.<Collision>} collisionsA
 * @param {Array.<Collision>} collisionsB
 * @returns {boolean}
 * @private
 */
function _doCollisionsMatch(collisionsA, collisionsB) {
  var count = collisionsA.length;

  if (count !== collisionsB.length) return false;

  for (var i = 0; i < count; i++) {
    var collisionA = collisionsA[i];
    var collisionB = collisionsB[i];
    if (collisionA.collidableA !== collisionB.collidableA || collisionA.collidableB !== collisionB.collidableB || !(0, _util.areVec3sClose)(collisionA.contactPoint, collisionB.contactPoint) || !(0, _util.areVec3sClose)(collisionA.contactNormal, collisionB.contactNormal)) {
      return false;
    }
  }

  return true;
}

/**
 * @param {Collidable} collidable
 * @private
 */
function _recordOldCollisionsForDevModeForCollidable(collidable) {
  if (!collidable.extraPreviousCollisions) {
    collidable.extraPreviousCollisions = [];
  }

  for (var i = 3; i > 0; i--) {
    collidable.extraPreviousCollisions[i] = collidable.extraPreviousCollisions[i - 1];
  }
  collidable.extraPreviousCollisions[0] = collidable.previousCollisions;
}

/**
 * @param {Collision} collision
 * @param {Object} thisController
 * @returns {Object}
 */
function getOtherControllerFromCollision(collision, thisController) {
  var controllerA = collision.collidableA.physicsJob.controller;
  var controllerB = collision.collidableB.physicsJob.controller;
  if (controllerA === thisController) {
    return controllerB;
  } else if (controllerB === thisController) {
    return controllerA;
  } else {
    throw new Error('Neither collidable corresponds to the given controller');
  }
}

exports.handleCollisionsForJob = handleCollisionsForJob;
exports.findIntersectingCollidablesForCollidable = findIntersectingCollidablesForCollidable;
exports.determineJobsAtRest = determineJobsAtRest;
exports.recordOldCollisionsForDevModeForAllCollidables = recordOldCollisionsForDevModeForAllCollidables;
exports.checkThatNoObjectsCollide = checkThatNoObjectsCollide;
exports.getOtherControllerFromCollision = getOtherControllerFromCollision;

},{"../../util":39,"./collidable-store":29,"./collision-utils":31}],31:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.detectBoundingVolumeIntersection = exports.calculateContact = exports.detectIntersection = undefined;

var _collidables = require('../collidables');

var _collisionDetection = require('../collision-detection');

var _contactCalculation = require('../contact-calculation');

/**
 * This module defines a collection of static utility functions for detecting and responding to
 * collisions.
 */

/**
 * @param {Collidable} a
 * @param {Collidable} b
 * @returns {boolean}
 */
function detectIntersection(a, b) {
  if (a instanceof _collidables.Sphere) {
    if (b instanceof _collidables.Sphere) {
      return _collisionDetection.sphereCollisionDetection.sphereVsSphere(a, b);
    } else if (b instanceof _collidables.Aabb) {
      return _collisionDetection.sphereCollisionDetection.sphereVsAabb(a, b);
    } else if (b instanceof _collidables.Capsule) {
      return _collisionDetection.sphereCollisionDetection.sphereVsCapsule(a, b);
    } else if (b instanceof _collidables.Obb) {
      return _collisionDetection.sphereCollisionDetection.sphereVsObb(a, b);
    } else {
      return _collisionDetection.sphereCollisionDetection.sphereVsPoint(a, b);
    }
  } else if (a instanceof _collidables.Aabb) {
    if (b instanceof _collidables.Sphere) {
      return _collisionDetection.aabbCollisionDetection.aabbVsSphere(a, b);
    } else if (b instanceof _collidables.Aabb) {
      return _collisionDetection.aabbCollisionDetection.aabbVsAabb(a, b);
    } else if (b instanceof _collidables.Capsule) {
      return _collisionDetection.aabbCollisionDetection.aabbVsCapsule(a, b);
    } else if (b instanceof _collidables.Obb) {
      return _collisionDetection.aabbCollisionDetection.aabbVsObb(a, b);
    } else {
      return _collisionDetection.aabbCollisionDetection.aabbVsPoint(a, b);
    }
  } else if (a instanceof _collidables.Capsule) {
    if (b instanceof _collidables.Sphere) {
      return _collisionDetection.capsuleCollisionDetection.capsuleVsSphere(a, b);
    } else if (b instanceof _collidables.Aabb) {
      return _collisionDetection.capsuleCollisionDetection.capsuleVsAabb(a, b);
    } else if (b instanceof _collidables.Capsule) {
      return _collisionDetection.capsuleCollisionDetection.capsuleVsCapsule(a, b);
    } else if (b instanceof _collidables.Obb) {
      return _collisionDetection.capsuleCollisionDetection.capsuleVsObb(a, b);
    } else {
      return _collisionDetection.capsuleCollisionDetection.capsuleVsPoint(a, b);
    }
  } else if (a instanceof _collidables.Obb) {
    if (b instanceof _collidables.Sphere) {
      return _collisionDetection.obbCollisionDetection.obbVsSphere(a, b);
    } else if (b instanceof _collidables.Aabb) {
      return _collisionDetection.obbCollisionDetection.obbVsAabb(a, b);
    } else if (b instanceof _collidables.Capsule) {
      return _collisionDetection.obbCollisionDetection.obbVsCapsule(a, b);
    } else if (b instanceof _collidables.Obb) {
      return _collisionDetection.obbCollisionDetection.obbVsObb(a, b);
    } else {
      return _collisionDetection.obbCollisionDetection.obbVsPoint(a, b);
    }
  } else {
    if (b instanceof _collidables.Sphere) {
      return _collisionDetection.sphereCollisionDetection.sphereVsPoint(b, a);
    } else if (b instanceof _collidables.Aabb) {
      return _collisionDetection.aabbCollisionDetection.aabbVsPoint(b, a);
    } else if (b instanceof _collidables.Capsule) {
      return _collisionDetection.capsuleCollisionDetection.capsuleVsPoint(b, a);
    } else if (b instanceof _collidables.Obb) {
      return _collisionDetection.obbCollisionDetection.obbVsPoint(b, a);
    } else {
      return false;
    }
  }
}

/**
 * @param {Collision} collision
 */
function calculateContact(collision) {
  var a = collision.collidableA;
  var b = collision.collidableB;
  var contactPoint = vec3.create();
  var contactNormal = vec3.create();

  if (a instanceof _collidables.Sphere) {
    if (b instanceof _collidables.Sphere) {
      _contactCalculation.sphereContactCalculation.sphereVsSphere(contactPoint, contactNormal, a, b);
    } else if (b instanceof _collidables.Aabb) {
      _contactCalculation.sphereContactCalculation.sphereVsAabb(contactPoint, contactNormal, a, b);
    } else if (b instanceof _collidables.Capsule) {
      _contactCalculation.sphereContactCalculation.sphereVsCapsule(contactPoint, contactNormal, a, b);
    } else if (b instanceof _collidables.Obb) {
      _contactCalculation.sphereContactCalculation.sphereVsObb(contactPoint, contactNormal, a, b);
    } else {
      _contactCalculation.sphereContactCalculation.sphereVsPoint(contactPoint, contactNormal, a, b);
    }
  } else if (a instanceof _collidables.Aabb) {
    if (b instanceof _collidables.Sphere) {
      _contactCalculation.aabbContactCalculation.aabbVsSphere(contactPoint, contactNormal, a, b);
    } else if (b instanceof _collidables.Aabb) {
      _contactCalculation.aabbContactCalculation.aabbVsAabb(contactPoint, contactNormal, a, b);
    } else if (b instanceof _collidables.Capsule) {
      _contactCalculation.aabbContactCalculation.aabbVsCapsule(contactPoint, contactNormal, a, b);
    } else if (b instanceof _collidables.Obb) {
      _contactCalculation.aabbContactCalculation.aabbVsObb(contactPoint, contactNormal, a, b);
    } else {
      _contactCalculation.aabbContactCalculation.aabbVsPoint(contactPoint, contactNormal, a, b);
    }
  } else if (a instanceof _collidables.Capsule) {
    if (b instanceof _collidables.Sphere) {
      _contactCalculation.capsuleContactCalculation.capsuleVsSphere(contactPoint, contactNormal, a, b);
    } else if (b instanceof _collidables.Aabb) {
      _contactCalculation.capsuleContactCalculation.capsuleVsAabb(contactPoint, contactNormal, a, b);
    } else if (b instanceof _collidables.Capsule) {
      _contactCalculation.capsuleContactCalculation.capsuleVsCapsule(contactPoint, contactNormal, a, b);
    } else if (b instanceof _collidables.Obb) {
      _contactCalculation.capsuleContactCalculation.capsuleVsObb(contactPoint, contactNormal, a, b);
    } else {
      _contactCalculation.capsuleContactCalculation.capsuleVsPoint(contactPoint, contactNormal, a, b);
    }
  } else if (a instanceof _collidables.Obb) {
    if (b instanceof _collidables.Sphere) {
      _contactCalculation.obbContactCalculation.obbVsSphere(contactPoint, contactNormal, a, b);
    } else if (b instanceof _collidables.Aabb) {
      _contactCalculation.obbContactCalculation.obbVsAabb(contactPoint, contactNormal, a, b);
    } else if (b instanceof _collidables.Capsule) {
      _contactCalculation.obbContactCalculation.obbVsCapsule(contactPoint, contactNormal, a, b);
    } else if (b instanceof _collidables.Obb) {
      _contactCalculation.obbContactCalculation.obbVsObb(contactPoint, contactNormal, a, b);
    } else {
      _contactCalculation.obbContactCalculation.obbVsPoint(contactPoint, contactNormal, a, b);
    }
  } else {
    if (b instanceof _collidables.Sphere) {
      _contactCalculation.sphereContactCalculation.sphereVsPoint(contactPoint, contactNormal, b, a);
    } else if (b instanceof _collidables.Aabb) {
      _contactCalculation.aabbContactCalculation.aabbVsPoint(contactPoint, contactNormal, b, a);
    } else if (b instanceof _collidables.Capsule) {
      _contactCalculation.capsuleContactCalculation.capsuleVsPoint(contactPoint, contactNormal, b, a);
    } else if (b instanceof _collidables.Obb) {
      _contactCalculation.obbContactCalculation.obbVsPoint(contactPoint, contactNormal, b, a);
    } else {}
    vec3.negate(contactNormal, contactNormal);
  }

  collision.contactPoint = contactPoint;
  collision.contactNormal = contactNormal;
}

/**
 * @param {Collidable} a
 * @param {Collidable} b
 * @returns {boolean}
 */
function detectBoundingVolumeIntersection(a, b) {
  return detectIntersection(a.boundingVolume, b.boundingVolume);
}

exports.detectIntersection = detectIntersection;
exports.calculateContact = calculateContact;
exports.detectBoundingVolumeIntersection = detectBoundingVolumeIntersection;

},{"../collidables":9,"../collision-detection":16,"../contact-calculation":21}],32:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _collisions = require('./collisions');

Object.keys(_collisions).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _collisions[key];
    }
  });
});

var _integrator = require('./integrator');

Object.keys(_integrator).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _integrator[key];
    }
  });
});

var _util = require('./util');

Object.keys(_util).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _util[key];
    }
  });
});

var _physicsEngine = require('./src/physics-engine');

Object.keys(_physicsEngine).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _physicsEngine[key];
    }
  });
});

var _physicsJob = require('./src/physics-job');

Object.keys(_physicsJob).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _physicsJob[key];
    }
  });
});

var _physicsState = require('./src/physics-state');

Object.keys(_physicsState).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _physicsState[key];
    }
  });
});

},{"./collisions":26,"./integrator":33,"./src/physics-engine":36,"./src/physics-job":37,"./src/physics-state":38,"./util":39}],33:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _integrator = require('./src/integrator');

Object.keys(_integrator).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _integrator[key];
    }
  });
});

var _rk4Integrator = require('./src/rk4-integrator');

Object.keys(_rk4Integrator).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _rk4Integrator[key];
    }
  });
});

},{"./src/integrator":34,"./src/rk4-integrator":35}],34:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

/**
 * This class numerically integrates the equations of motion. That is, an integrator implements
 * physics simulations by updating position and velocity values for each time step.
 *
 * @abstract
 */
var Integrator = function () {
  function Integrator() {
    _classCallCheck(this, Integrator);

    // Integrator is an abstract class. It should not be instantiated directly.
    if (new.target === Integrator) {
      throw new TypeError('Cannot construct Integrator instances directly');
    }
  }

  /**
   * Integrate the state from t to t + dt.
   *
   * @param {PhysicsJob} job
   * @param {number} t Total elapsed time.
   * @param {number} dt Duration of the current time step.
   * @abstract
   */

  _createClass(Integrator, [{
    key: 'integrate',
    value: function integrate(job, t, dt) {
      // Extending classes should implement this method.
      throw new TypeError('Method not implemented');
    }

    /**
     * @returns {PhysicsDerivative}
     */

  }], [{
    key: 'createDerivative',
    value: function createDerivative() {
      return {
        velocity: vec3.create(),
        force: vec3.create(),
        spin: quat.create(),
        torque: vec3.create()
      };
    }
  }]);

  return Integrator;
}();

exports.Integrator = Integrator;

/**
 * @typedef {Object} PhysicsDerivative
 * @property {vec3} velocity Derivative of position.
 * @property {vec3} force Derivative of momentum.
 * @property {quat} spin Derivative of orientation.
 * @property {vec3} torque Derivative of angular momentum.
 */

/**
 * @typedef {Object} ForceApplierOutput
 * @property {vec3} force
 * @property {vec3} torque
 */

/**
 * @typedef {Object} ForceApplierInput
 * @property {PhysicsState} state
 * @property {number} t
 * @property {number} dt
 */

},{}],35:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.rk4Integrator = undefined;

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _util2 = require('../../util');

var _integrator = require('./integrator');

var _physicsState = require('../../src/physics-state');

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && ((typeof call === "undefined" ? "undefined" : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === "undefined" ? "undefined" : _typeof(superClass)));
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

// TODO: Account for the fact that collisions take place between time steps; integration should
// really consider the previous state as being the time and state at the moment of collision.

/**
 * This class numerically integrates the equations of motion. That is, this implements physics
 * simulations by updating position and velocity values for each time step.
 *
 * This integrator is an implementation of the classical Runge-Kutta method (RK4)
 * (https://en.wikipedia.org/wiki/Runge_kutta).
 *
 * This integrator causes energy to be lost at a small rate. This is a common problem for numerical
 * integrators, and is usually negligible.
 */
var RK4Integrator = function (_Integrator) {
  _inherits(RK4Integrator, _Integrator);

  function RK4Integrator() {
    _classCallCheck(this, RK4Integrator);

    var _this = _possibleConstructorReturn(this, (RK4Integrator.__proto__ || Object.getPrototypeOf(RK4Integrator)).call(this));

    if (_util2._util.isInDevMode) {
      _this._wrapForDevMode();
    }
    return _this;
  }

  /**
   * Integrate the state from t to t + dt.
   *
   * @param {PhysicsJob} job
   * @param {number} t Total elapsed time.
   * @param {number} dt Duration of the current time step.
   */

  _createClass(RK4Integrator, [{
    key: 'integrate',
    value: function integrate(job, t, dt) {
      var state = job.currentState;
      _tempState.copy(state);

      _calculateDerivative(_a, _tempState, job, t, 0, _EMPTY_DERIVATIVE);
      _calculateDerivative(_b, _tempState, job, t, dt * 0.5, _a);
      _calculateDerivative(_c, _tempState, job, t, dt * 0.5, _b);
      _calculateDerivative(_d, _tempState, job, t, dt, _c);

      _calculateVec3DerivativeWeightedSum(_positionDerivative, _a.velocity, _b.velocity, _c.velocity, _d.velocity);
      _calculateVec3DerivativeWeightedSum(_momentumDerivative, _a.force, _b.force, _c.force, _d.force);
      _calculateQuatDerivativeWeightedSum(_orientationDerivative, _a.spin, _b.spin, _c.spin, _d.spin);
      _calculateVec3DerivativeWeightedSum(_angularMomentumDerivative, _a.torque, _b.torque, _c.torque, _d.torque);

      vec3.scaleAndAdd(state.position, state.position, _positionDerivative, dt);
      vec3.scaleAndAdd(state.momentum, state.momentum, _momentumDerivative, dt);
      _util2._geometry.scaleAndAddQuat(state.orientation, state.orientation, _orientationDerivative, dt);
      vec3.scaleAndAdd(state.angularMomentum, state.angularMomentum, _angularMomentumDerivative, dt);

      state.updateDependentFields();
    }

    /**
     * Wraps the integrate method and check for NaN values after each integration.
     *
     * @private
     */

  }, {
    key: '_wrapForDevMode',
    value: function _wrapForDevMode() {
      var unguardedIntegrate = this.integrate.bind(this);
      this.integrate = function (job, t, dt) {
        unguardedIntegrate(job, t, dt);
        _checkForStateError(job.currentState);
      };
    }
  }]);

  return RK4Integrator;
}(_integrator.Integrator);

/**
 * Calculate the derivative from the given state with the given time step.
 *
 * @param {PhysicsDerivative} out
 * @param {PhysicsState} state
 * @param {PhysicsJob} job
 * @param {number} t
 * @param {number} dt
 * @param {PhysicsDerivative} d
 * @private
 */

function _calculateDerivative(out, state, job, t, dt, d) {
  vec3.scaleAndAdd(state.position, state.position, d.velocity, dt);
  vec3.scaleAndAdd(state.momentum, state.momentum, d.force, dt);
  _util2._geometry.scaleAndAddQuat(state.orientation, state.orientation, d.spin, dt);
  vec3.scaleAndAdd(state.angularMomentum, state.angularMomentum, d.torque, dt);

  state.updateDependentFields();

  out.velocity = state.velocity;
  out.spin = state.spin;
  vec3.set(out.force, 0, 0, 0);
  vec3.set(out.torque, 0, 0, 0);

  _forceApplierOutput.force = out.force;
  _forceApplierOutput.torque = out.torque;
  _forceApplierInput.state = state;
  _forceApplierInput.t = t + dt;
  _forceApplierInput.dt = dt;

  job.applyForces(_forceApplierOutput, _forceApplierInput);
}

var _EMPTY_DERIVATIVE = _integrator.Integrator.createDerivative();

var _tempState = new _physicsState.PhysicsState();
var _a = _integrator.Integrator.createDerivative();
var _b = _integrator.Integrator.createDerivative();
var _c = _integrator.Integrator.createDerivative();
var _d = _integrator.Integrator.createDerivative();

var _positionDerivative = vec3.create();
var _momentumDerivative = vec3.create();
var _orientationDerivative = quat.create();
var _angularMomentumDerivative = vec3.create();

var _forceApplierOutput = {};
var _forceApplierInput = {};

/**
 * @param {vec3} out
 * @param {vec3} a
 * @param {vec3} b
 * @param {vec3} c
 * @param {vec3} d
 * @private
 */
function _calculateVec3DerivativeWeightedSum(out, a, b, c, d) {
  out[0] = 1 / 6 * (a[0] + 2 * (b[0] + c[0]) + d[0]);
  out[1] = 1 / 6 * (a[1] + 2 * (b[1] + c[1]) + d[1]);
  out[2] = 1 / 6 * (a[2] + 2 * (b[2] + c[2]) + d[2]);
}

/**
 * @param {quat} out
 * @param {quat} a
 * @param {quat} b
 * @param {quat} c
 * @param {quat} d
 * @private
 */
function _calculateQuatDerivativeWeightedSum(out, a, b, c, d) {
  out[0] = 1 / 6 * (a[0] + 2 * (b[0] + c[0]) + d[0]);
  out[1] = 1 / 6 * (a[1] + 2 * (b[1] + c[1]) + d[1]);
  out[2] = 1 / 6 * (a[2] + 2 * (b[2] + c[2]) + d[2]);
  out[3] = 1 / 6 * (a[3] + 2 * (b[3] + c[3]) + d[3]);
}

/**
 * @param {PhysicsState} state
 * @private
 */
function _checkForStateError(state) {
  var errorProperties = ['position', 'momentum', 'orientation', 'angularMomentum'].filter(function (property) {
    return _containsNaN(state[property]);
  });
  var property = errorProperties[0];
  if (property) {
    throw new Error(property + ' contains a NaN value after integrating: ' + state[property]);
  }
}

/**
 * Determines whether the given vector contains a NaN value.
 *
 * @param {vec3} v
 * @private
 */
function _containsNaN(v) {
  return isNaN(v[0]) || isNaN(v[1]) || isNaN(v[2]);
}

var rk4Integrator = new RK4Integrator();

exports.rk4Integrator = rk4Integrator;

},{"../../src/physics-state":38,"../../util":39,"./integrator":34}],36:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PhysicsEngine = undefined;

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _lslAnimatex = require('lsl-animatex');

var _util2 = require('../util');

var _collisions = require('../collisions');

var _physicsState = require('./physics-state');

var _integrator = require('../integrator');

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && ((typeof call === "undefined" ? "undefined" : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === "undefined" ? "undefined" : _typeof(superClass)));
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

var _FRAME_LATENCY_LOG_PERIOD = 5000;
var _LATENCY_LOG_LABEL = 'Physics frame duration';

/**
 * This physics engine simulates high-performance, three-dimensional rigid-body dynamics.
 *
 * Notable features:
 * - Includes collision detection with impulse-based resolution.
 * - Decouples the physics simulation and animation rendering time steps, and uses a fixed timestep
 * for the physics loop. This gives us numerical stability and precise reproducibility.
 * - Suppresses linear and angular momenta below a certain threshold.
 *
 * The engine consists primarily of a collection of individual physics jobs and an update loop. This
 * update loop is in turn controlled by the animation loop. However, whereas the animation loop
 * renders each job once per frame loop--regardless of how much time actually elapsed since the
 * previous frame--the physics loop updates its jobs at a constant rate. To reconcile these frame
 * rates, the physics loop runs as many times as is needed in order to catch up to the time of the
 * current animation frame. The physics frame rate should be much higher than the animation frame
 * rate.
 *
 * It is VERY IMPORTANT for a PhysicsJob to minimize the runtime of its update step.
 *
 * ## A note on job order
 *
 * The integration+collision pipeline handle one job at a time. A consequence of this design
 * is that half of the collisions technically represent a false interaction between the state of the
 * first object at time t and the state of the second object at time t - 1.
 *
 * This implementation prevents a more problematic issue. If all objects were first integrated, then
 * all objects were checked for collisions, then all collisions were resolved, then the following
 * scenario could arise:
 * - The next position of object A collides with the previous position of object B, but not with the
 *   next position of object B, so object A moves successfully to its new position.
 * - The next position of object B collides with the next position of object C, so objects B and C
 *   are reset to their previous positions.
 * - Object B and C now intersect.
 */

var PhysicsEngine = function (_PersistentAnimationJ) {
  _inherits(PhysicsEngine, _PersistentAnimationJ);

  /**
   * Clients should call PhysicsEngine.create instead of instantiating a PhysicsEngine directly.
   *
   * @param {PhysicsConfig} physicsParams
   */
  function PhysicsEngine(physicsParams) {
    _classCallCheck(this, PhysicsEngine);

    var _this = _possibleConstructorReturn(this, (PhysicsEngine.__proto__ || Object.getPrototypeOf(PhysicsEngine)).call(this));

    if (_physicsEngine) {
      throw new Error('Can\'t instantiate multiple instances of PhysicsEngine.');
    }

    _physicsEngine = _this;

    _this._physicsParams = physicsParams;
    _this.integrator = _integrator.rk4Integrator;
    _this._elapsedTime = 0.0;
    _this._remainingTime = 0.0;
    _this._nonCollidableJobs = [];
    _this._collidableJobs = [];

    if (_util2._util.isInDevMode) {
      _this._setUpForInDevMode();
    }
    return _this;
  }

  /**
   * @param {PhysicsConfig} physicsParams
   */

  _createClass(PhysicsEngine, [{
    key: 'reset',
    value: function reset() {
      this._elapsedTime = 0.0;
      this._remainingTime = 0.0;
      this._nonCollidableJobs = [];
      this._collidableJobs = [];
    }

    /**
     * Adds the given PhysicsJob.
     *
     * @param {PhysicsJob} job
     */

  }, {
    key: 'addJob',
    value: function addJob(job) {
      // console.debug(`Starting PhysicsJob`);

      if (job instanceof _collisions.CollidablePhysicsJob) {
        this._collidableJobs.push(job);
      } else {
        this._nonCollidableJobs.push(job);
      }
    }

    /**
     * Removes the given PhysicsJob.
     *
     * Throws no error if the job is not registered.
     *
     * @param {PhysicsJob} job
     */

  }, {
    key: 'removeJob',
    value: function removeJob(job) {
      // console.debug(`Cancelling PhysicsJob`);
      this._removeJob(job);
    }

    /**
     * Wraps the draw and update methods in a profiler function that will track the frame latencies.
     *
     * @private
     */

  }, {
    key: '_setUpForInDevMode',
    value: function _setUpForInDevMode() {
      var unwrappedUpdate = this.update.bind(this);
      var latencyProfiler = new _lslAnimatex.FrameLatencyProfiler(_FRAME_LATENCY_LOG_PERIOD, this._physicsParams.timeStepDuration, _LATENCY_LOG_LABEL);
      latencyProfiler.start();

      this.update = function () {
        var beforeTime = performance.now();
        unwrappedUpdate.apply(undefined, arguments);
        var deltaTime = performance.now() - beforeTime;
        latencyProfiler.recordFrameLatency(deltaTime);
      };
    }

    /**
     * Update the physics state for the current animation update frame.
     *
     * @param {DOMHighResTimeStamp} currentTime
     * @param {DOMHighResTimeStamp} deltaTime
     */

  }, {
    key: 'update',
    value: function update(currentTime, deltaTime) {
      this._remainingTime += deltaTime;

      // Run as many constant-interval physics updates as are needed for the given animation frame
      // interval.
      while (this._remainingTime >= this._physicsParams.timeStepDuration) {
        this._updateToNextPhysicsFrame();
        this._elapsedTime += this._physicsParams.timeStepDuration;
        this._remainingTime -= this._physicsParams.timeStepDuration;
      }

      // Calculate the intermediate physics state to use for rendering the current animation frame.
      var partialRatio = this._remainingTime / this._physicsParams.timeStepDuration;
      this._setPartialStateForRenderTimeStepForAllJobs(partialRatio);
    }
  }, {
    key: '_updateToNextPhysicsFrame',
    value: function _updateToNextPhysicsFrame() {
      var _this2 = this;

      if (_util2._util.isInDevMode) {
        this._recordOldStatesForAllJobsForDevMode();
        (0, _collisions.recordOldCollisionsForDevModeForAllCollidables)();
      }

      this._nonCollidableJobs.forEach(this._integratePhysicsStateForJob.bind(this));
      this._collidableJobs.forEach(function (job) {
        if (!job.isAtRest) {
          _this2._integratePhysicsStateForCollidableJob(job);
          (0, _collisions.handleCollisionsForJob)(job, _this2._elapsedTime, _this2._physicsParams);
        }
      });

      if (_util2._util.isInDevMode) {
        (0, _collisions.checkThatNoObjectsCollide)();
      }

      this._suppressLowMomentaForAllJobs();

      (0, _collisions.determineJobsAtRest)(this._collidableJobs);
    }

    /**
     * Removes the given job from the collection of active jobs if it exists.
     *
     * @param {PhysicsJob} job
     * @param {number} [index=-1]
     * @private
     */

  }, {
    key: '_removeJob',
    value: function _removeJob(job) {
      var index = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : -1;

      if (job instanceof _collisions.CollidablePhysicsJob) {
        _removeJobFromCollection(job, index, this._collidableJobs);
      } else {
        _removeJobFromCollection(job, index, this._nonCollidableJobs);
      }
    }

    /**
     * Update the current physics state for a job for the current physics update frame.
     *
     * This includes applying all forces that have been registered with the physics job.
     *
     * @param {CollidablePhysicsJob} job
     * @private
     */

  }, {
    key: '_integratePhysicsStateForCollidableJob',
    value: function _integratePhysicsStateForCollidableJob(job) {
      this._integratePhysicsStateForJob(job);

      // Update the collidable's position and orientation.
      job.collidable.position = job.currentState.position;
      job.collidable.orientation = job.currentState.orientation;
    }

    /**
     * Update the current physics state for a job for the current physics update frame.
     *
     * This includes applying all forces that have been registered with the physics job.
     *
     * @param {PhysicsJob} job
     * @private
     */

  }, {
    key: '_integratePhysicsStateForJob',
    value: function _integratePhysicsStateForJob(job) {
      job.previousState.copy(job.currentState);
      this.integrator.integrate(job, this._elapsedTime, this._physicsParams.timeStepDuration);
    }
  }, {
    key: '_suppressLowMomentaForAllJobs',
    value: function _suppressLowMomentaForAllJobs() {
      var _this3 = this;

      this._collidableJobs.forEach(function (job) {
        return _suppressLowMomentaForJob(job, _this3._physicsParams.lowMomentumSuppressionThreshold, _this3._physicsParams.lowAngularMomentumSuppressionThreshold);
      });
      this._nonCollidableJobs.forEach(function (job) {
        return _suppressLowMomentaForJob(job, _this3._physicsParams.lowMomentumSuppressionThreshold, _this3._physicsParams.lowAngularMomentumSuppressionThreshold);
      });
    }

    /**
     * Calculate the intermediate physics state to use for rendering the current animation frame. The
     * given ratio specifies how far the current render frame is between the previous and current
     * physics update frames.
     *
     * @param {number} partialRatio
     * @private
     */

  }, {
    key: '_setPartialStateForRenderTimeStepForAllJobs',
    value: function _setPartialStateForRenderTimeStepForAllJobs(partialRatio) {
      this._collidableJobs.forEach(_setPartialStateForRenderTimeStepForJob.bind(null, partialRatio));
      this._nonCollidableJobs.forEach(_setPartialStateForRenderTimeStepForJob.bind(null, partialRatio));
    }
  }, {
    key: '_recordOldStatesForAllJobsForDevMode',
    value: function _recordOldStatesForAllJobsForDevMode() {
      this._collidableJobs.forEach(_recordOldStatesForJob);
      this._nonCollidableJobs.forEach(_recordOldStatesForJob);
    }
  }, {
    key: 'draw',
    value: function draw() {}

    /**
     * @returns {PhysicsEngine}
     */

  }], [{
    key: 'create',
    value: function create(physicsParams) {
      new PhysicsEngine(physicsParams);
    }
  }, {
    key: 'instance',
    get: function get() {
      if (!_physicsEngine) {
        throw new Error('Can\'t access PhysicsEngine.instance before it has been instantiated.');
      }
      return _physicsEngine;
    }
  }]);

  return PhysicsEngine;
}(_lslAnimatex.PersistentAnimationJob);

/**
 * @param {PhysicsJob} job
 * @param {number} lowMomentumSuppressionThreshold
 * @param {number} lowAngularMomentumSuppressionThreshold
 * @private
 */

function _suppressLowMomentaForJob(job, lowMomentumSuppressionThreshold, lowAngularMomentumSuppressionThreshold) {
  var currentState = job.currentState;

  if (vec3.squaredLength(currentState.momentum) < lowMomentumSuppressionThreshold) {
    vec3.set(currentState.momentum, 0, 0, 0);
  }

  if (vec3.squaredLength(currentState.angularMomentum) < lowAngularMomentumSuppressionThreshold) {
    vec3.set(currentState.angularMomentum, 0, 0, 0);
  }
}

/**
 * @param {PhysicsJob} job
 * @param {number} index
 * @param {Array.<PhysicsJob>} jobs
 * @private
 */
function _removeJobFromCollection(job, index, jobs) {
  if (index >= 0) {
    jobs.splice(index, 1);
  } else {
    var count = jobs.length;
    for (index = 0; index < count; index++) {
      if (jobs[index] === job) {
        jobs.splice(index, 1);
        break;
      }
    }
  }
}

/**
 * @param {number} partialRatio
 * @param {PhysicsJob} job
 * @private
 */
function _setPartialStateForRenderTimeStepForJob(partialRatio, job) {
  job.renderState.lerp(job.previousState, job.currentState, partialRatio);
}

/**
 * @param {PhysicsJob} job
 * @private
 */
function _recordOldStatesForJob(job) {
  if (!job.extraPreviousStates) {
    job.extraPreviousStates = [];
    for (var i = 0; i < 4; i++) {
      job.extraPreviousStates[i] = new _physicsState.PhysicsState();
    }
  }

  for (var _i = 3; _i > 0; _i--) {
    job.extraPreviousStates[_i].copy(job.extraPreviousStates[_i - 1]);
  }
  job.extraPreviousStates[0].copy(job.previousState);
}

var _physicsEngine = null;

exports.PhysicsEngine = PhysicsEngine;

},{"../collisions":26,"../integrator":33,"../util":39,"./physics-state":38,"lsl-animatex":1}],37:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PhysicsJob = undefined;

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _lslAnimatex = require('lsl-animatex');

var _physicsEngine = require('./physics-engine');

var _physicsState = require('./physics-state');

var _util2 = require('../util');

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

/**
 * A PhysicsJob maintains a current force/momentum state and defines a method for applying forces at
 * a given physics time step.
 */
var PhysicsJob = function () {
  /**
   * @param {Array.<ForceApplier>} [forceAppliers]
   * @param {PhysicsState} [state]
   */
  function PhysicsJob(forceAppliers, state) {
    _classCallCheck(this, PhysicsJob);

    forceAppliers = forceAppliers || [];
    state = state || new _physicsState.PhysicsState();

    this.startTime = null;
    this.currentState = state;
    this.previousState = null;
    this.renderState = null;
    this._forceAppliers = forceAppliers;
  }

  /**
   * @param {ForceApplierOutput} outputParams
   * @param {ForceApplierInput} inputParams
   */

  _createClass(PhysicsJob, [{
    key: 'applyForces',
    value: function applyForces(outputParams, inputParams) {
      this._forceAppliers.forEach(function (forceApplier) {
        return forceApplier(outputParams, inputParams);
      });
    }

    /**
     * @param {ForceApplier} forceApplier
     * @param {number} [index=0] The index to add the given force applier in the current list of
     * appliers.
     */

  }, {
    key: 'addForceApplier',
    value: function addForceApplier(forceApplier) {
      var index = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

      this._forceAppliers.splice(index, 0, forceApplier);
    }

    /**
     * @param {ForceApplier} forceApplier
     */

  }, {
    key: 'removeForceApplier',
    value: function removeForceApplier(forceApplier) {
      this._forceAppliers.splice(this._forceAppliers.indexOf(forceApplier), 1);
    }

    /**
     * Registers this PhysicsJob and all of its descendant child jobs with the physics engine.
     *
     * @param {number} [startTime]
     */

  }, {
    key: 'start',
    value: function start(startTime) {
      this.startTime = startTime || _lslAnimatex.animator.currentTime;

      var previousState = new _physicsState.PhysicsState();
      previousState.copy(this.currentState);
      var renderState = new _physicsState.PhysicsState();
      renderState.copy(this.currentState);

      this.previousState = previousState;
      this.renderState = renderState;

      if (_util2._util.isInDevMode) {
        // It is useful for debugging to be able to trace the states back to their jobs.
        this.currentState.job = this;
        this.previousState.job = this;
        this.renderState.job = this;
      }

      _physicsEngine.PhysicsEngine.instance.addJob(this);
    }

    /**
     * Unregisters this PhysicsJob and all of its descendant child jobs with the physics engine.
     *
     * Throws no error if the job is not registered.
     */

  }, {
    key: 'finish',
    value: function finish() {
      _physicsEngine.PhysicsEngine.instance.removeJob(this);
    }

    /**
     * @param {number} [startTime]
     */

  }, {
    key: 'restart',
    value: function restart(startTime) {
      this.finish();
      this.start(startTime);
    }
  }]);

  return PhysicsJob;
}();

exports.PhysicsJob = PhysicsJob;

/**
 * @typedef {Function} ForceApplier
 * @property {vec3} force Output.
 * @property {vec3} torque Output.
 * @property {PhysicsState} state Input.
 * @property {number} t Input.
 * @property {number} dt Input.
 */

/**
 * @typedef {Object} PhysicsConfig
 * @property {number} timeStepDuration
 * @property {number} gravity
 * @property {vec3} _gravityVec
 * @property {number} linearDragCoefficient
 * @property {number} angularDragCoefficient
 * @property {number} coefficientOfRestitution
 * @property {number} coefficientOfFriction
 * @property {number} lowMomentumSuppressionThreshold
 * @property {number} lowAngularMomentumSuppressionThreshold
 */

},{"../util":39,"./physics-engine":36,"./physics-state":38,"lsl-animatex":1}],38:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.PhysicsState = undefined;

var _createClass = function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
}();

var _util = require('../util');

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

/**
 * This class represents the state of an object that is needed for a physics simulation (such as
 * position, momentum, and mass).
 */
var PhysicsState = function () {
    /**
     * @param {DynamicsConfig} [dynamicsParams={}]
     */
    function PhysicsState() {
        var dynamicsParams = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        _classCallCheck(this, PhysicsState);

        var position = dynamicsParams.position || vec3.create();
        var momentum = dynamicsParams.momentum || vec3.create();
        var orientation = dynamicsParams.orientation || quat.create();
        var angularMomentum = dynamicsParams.angularMomentum || vec3.create();
        var mass = dynamicsParams.mass || 1;
        var unrotatedInertiaTensor = dynamicsParams.unrotatedInertiaTensor || (0, _util.createBoxInertiaTensor)(1, 1, 1, mass);

        // Constant fields.

        this.mass = mass;
        this.inverseMass = 1 / mass;
        this.unrotatedInertiaTensor = unrotatedInertiaTensor;

        // Independent fields.

        this.position = position;
        this.momentum = momentum;
        this.orientation = orientation;
        this.angularMomentum = angularMomentum;

        // Dependent fields.

        // Linear velocity.
        this.velocity = vec3.create();
        // Quaternion-based representation of the rate of change in orientation.
        this.spin = quat.create();
        // Vector-based representation of the angular velocity.
        this.angularVelocity = vec3.create();
        // The inverse inertia tensor rotated to the world coordinate frame.
        this.inverseInertiaTensor = mat3.create();

        this.updateDependentFields();
    }

    _createClass(PhysicsState, [{
        key: 'updateDependentFields',
        value: function updateDependentFields() {
            // TODO: Test this somehow...
            // Update linear velocity.
            vec3.scale(this.velocity, this.momentum, this.inverseMass);

            // Update angular velocity.
            quat.normalize(this.orientation, this.orientation);
            (0, _util.rotateTensor)(this.inverseInertiaTensor, this.unrotatedInertiaTensor, this.orientation);
            mat3.invert(this.inverseInertiaTensor, this.unrotatedInertiaTensor);
            vec3.transformMat3(this.angularVelocity, this.angularMomentum, this.inverseInertiaTensor);
            quat.set(this.spin, this.angularVelocity[0], this.angularVelocity[1], this.angularVelocity[2], 0);
            quat.scale(this.spin, this.spin, 0.5);
            quat.multiply(this.spin, this.spin, this.orientation);
        }

        /**
         * Perform a deep copy.
         *
         * @param {PhysicsState} other
         */

    }, {
        key: 'copy',
        value: function copy(other) {
            this.mass = other.mass;
            this.inverseMass = other.inverseMass;
            mat3.copy(this.unrotatedInertiaTensor, other.unrotatedInertiaTensor);
            mat3.copy(this.inverseInertiaTensor, other.inverseInertiaTensor);
            vec3.copy(this.position, other.position);
            vec3.copy(this.momentum, other.momentum);
            quat.copy(this.orientation, other.orientation);
            vec3.copy(this.angularMomentum, other.angularMomentum);
            vec3.copy(this.velocity, other.velocity);
            quat.copy(this.spin, other.spin);
            vec3.copy(this.angularVelocity, other.angularVelocity);
        }

        /**
         * @param {PhysicsState} a
         * @param {PhysicsState} b
         * @param {number} partialRatio
         */

    }, {
        key: 'lerp',
        value: function lerp(a, b, partialRatio) {
            vec3.lerp(this.position, a.position, b.position, partialRatio);
            vec3.lerp(this.momentum, a.momentum, b.momentum, partialRatio);
            quat.slerp(this.orientation, a.orientation, b.orientation, partialRatio);
            quat.normalize(this.orientation, this.orientation);
            vec3.lerp(this.angularMomentum, a.angularMomentum, b.angularMomentum, partialRatio);
            this.updateDependentFields();
        }
    }]);

    return PhysicsState;
}();

exports.PhysicsState = PhysicsState;

/**
 * @typedef {Object} DynamicsConfig
 * @property {vec3} [position]
 * @property {vec3} [momentum]
 * @property {quat} [orientation]
 * @property {vec3} [angularMomentum]
 * @property {number} [mass]
 * @property {mat3} [unrotatedInertiaTensor]
 */

},{"../util":39}],39:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _forceUtils = require('./src/force-utils');

Object.keys(_forceUtils).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _forceUtils[key];
    }
  });
});

var _geometry = require('./src/geometry');

Object.keys(_geometry).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _geometry[key];
    }
  });
});

var _inertiaTensorUtils = require('./src/inertia-tensor-utils');

Object.keys(_inertiaTensorUtils).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _inertiaTensorUtils[key];
    }
  });
});

var _util = require('./src/util');

Object.keys(_util).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _util[key];
    }
  });
});

},{"./src/force-utils":40,"./src/geometry":41,"./src/inertia-tensor-utils":42,"./src/util":43}],40:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * This module defines a collection of static general utility functions for calculating forces.
 */

/**
 * @param {GravityApplierConfig} config
 * @param {ForceApplierOutput} output
 * @param {ForceApplierInput} input
 */
function applyGravity(config, output, input) {
  vec3.scaleAndAdd(output.force, output.force, config._gravityVec, input.state.mass);
}

/**
 * @param {LinearDragApplierConfig} config
 * @param {ForceApplierOutput} output
 * @param {ForceApplierInput} input
 */
function applyLinearDrag(config, output, input) {
  var dragMagnitude = -vec3.squaredLength(input.state.velocity) * config.linearDragCoefficient;
  vec3.normalize(_vec3, input.state.velocity);
  vec3.scaleAndAdd(output.force, output.force, _vec3, dragMagnitude);
}

/**
 * @param {AngularDragApplierConfig} config
 * @param {ForceApplierOutput} output
 * @param {ForceApplierInput} input
 */
function applyAngularDrag(config, output, input) {
  vec3.scaleAndAdd(output.torque, output.torque, input.state.angularVelocity, config.angularDragCoefficient);
}

/**
 * Applies a simple linear spring force (using Hooke's law).
 *
 * force = displacement * coefficient
 *
 * @param {LinearSpringForceApplierConfig} config
 * @param {ForceApplierOutput} output
 * @param {ForceApplierInput} input
 */
function applyLinearSpringForce(config, output, input) {
  vec3.subtract(_vec3, config.getIntendedPosition(), input.state.position);
  vec3.scaleAndAdd(output.force, output.force, _vec3, config.springCoefficient);
}

/**
 * @param {SpringDampingApplierConfig} config
 * @param {ForceApplierOutput} output
 * @param {ForceApplierInput} input
 */
function applySpringDamping(config, output, input) {
  vec3.scale(_vec3, input.state.velocity, -config.dampingCoefficient);
  vec3.add(output.force, output.force, _vec3);
}

var _vec3 = vec3.create();

exports.applyAngularDrag = applyAngularDrag;
exports.applyGravity = applyGravity;
exports.applyLinearDrag = applyLinearDrag;
exports.applyLinearSpringForce = applyLinearSpringForce;
exports.applySpringDamping = applySpringDamping;

/**
 * @typedef {Object} GravityApplierConfig
 * @property {vec3} _gravityVec
 */

/**
 * @typedef {Object} LinearDragApplierConfig
 * @property {number} linearDragCoefficient
 */

/**
 * @typedef {Object} AngularDragApplierConfig
 * @property {number} angularDragCoefficient
 */

/**
 * @typedef {Object} LinearSpringForceApplierConfig
 * @property {number} springCoefficient
 * @property {Function.<vec3>} getIntendedPosition
 */

/**
 * @typedef {Object} SpringDampingApplierConfig
 * @property {number} dampingCoefficient
 */

},{}],41:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * This module defines a collection of static geometry utility functions.
 */

var EPSILON = 0.0000001;
var HALF_PI = Math.PI / 2;
var TWO_PI = Math.PI * 2;

/**
 * Finds the minimum squared distance between two line segments.
 *
 * @param {LineSegment} segmentA
 * @param {LineSegment} segmentB
 * @returns {number}
 */
function findSquaredDistanceBetweenSegments(segmentA, segmentB) {
  findClosestPointsFromSegmentToSegment(_segmentDistance_tmpVecA, _segmentDistance_tmpVecB, segmentA, segmentB);
  return vec3.squaredDistance(_segmentDistance_tmpVecA, _segmentDistance_tmpVecB);
}

/**
 * Finds the minimum squared distance between a line segment and a point.
 *
 * @param {LineSegment} segment
 * @param {vec3} point
 * @returns {number}
 */
function findSquaredDistanceFromSegmentToPoint(segment, point) {
  findClosestPointOnSegmentToPoint(_segmentDistance_tmpVecA, segment, point);
  return vec3.squaredDistance(_segmentDistance_tmpVecA, point);
}

var _segmentDistance_tmpVecA = vec3.create();
var _segmentDistance_tmpVecB = vec3.create();

/**
 * @param {vec3} outputPoint Output parameter.
 * @param {Aabb} aabb
 * @param {vec3} targetPoint
 */
function findClosestPointFromAabbToPoint(outputPoint, aabb, targetPoint) {
  outputPoint[0] = aabb.minX > targetPoint[0] ? aabb.minX : aabb.maxX < targetPoint[0] ? aabb.maxX : targetPoint[0];
  outputPoint[1] = aabb.minY > targetPoint[1] ? aabb.minY : aabb.maxY < targetPoint[1] ? aabb.maxY : targetPoint[1];
  outputPoint[2] = aabb.minZ > targetPoint[2] ? aabb.minZ : aabb.maxZ < targetPoint[2] ? aabb.maxZ : targetPoint[2];
}

/**
 * @param {vec3} outputPoint Output parameter.
 * @param {Aabb} aabb
 * @param {vec3} targetPoint
 */
function findClosestPointFromAabbSurfaceToPoint(outputPoint, aabb, targetPoint) {
  findClosestPointFromAabbToPoint(outputPoint, aabb, targetPoint);

  // If the calculated point lies within the AABB, then we need to adjust one coordinate to lie
  // along the edge of the AABB.
  if (aabbVsPoint(aabb, outputPoint)) {
    // Calculate the closest vertex.
    _tmpVec1[0] = targetPoint[0] - aabb.minX < aabb.maxX - targetPoint[0] ? aabb.minX : aabb.maxX;
    _tmpVec1[1] = targetPoint[1] - aabb.minY < aabb.maxY - targetPoint[1] ? aabb.minY : aabb.maxY;
    _tmpVec1[2] = targetPoint[2] - aabb.minZ < aabb.maxZ - targetPoint[2] ? aabb.minZ : aabb.maxZ;

    // Calculate the distance to the vertex along each dimension.
    _tmpVec2[0] = _tmpVec1[0] - outputPoint[0];
    _tmpVec2[0] = _tmpVec2[0] < 0 ? -_tmpVec2[0] : _tmpVec2[0];
    _tmpVec2[1] = _tmpVec1[1] - outputPoint[1];
    _tmpVec2[1] = _tmpVec2[1] < 1 ? -_tmpVec2[1] : _tmpVec2[1];
    _tmpVec2[2] = _tmpVec1[2] - outputPoint[2];
    _tmpVec2[2] = _tmpVec2[2] < 2 ? -_tmpVec2[2] : _tmpVec2[2];

    // Determine along which dimension the point is closest to the AABB.
    var index = _tmpVec2[0] < _tmpVec2[1] ? _tmpVec2[0] < _tmpVec2[2] ? 0 : 2 : _tmpVec2[1] < _tmpVec2[2] ? 1 : 2;

    outputPoint[index] = _tmpVec1[index];
  }
}

/**
 * Finds the point of intersection between a line segment and a coplanar quadrilateral.
 *
 * This assumes the region is not degenerate (has non-zero side lengths).
 *
 * @param {vec3} poi Output param. Null if there is no intersection.
 * @param {LineSegment} segment
 * @param {vec3} planeVertex1
 * @param {vec3} planeVertex2
 * @param {vec3} planeVertex3
 * @param {vec3} planeVertex4
 * @returns {boolean} True if there is an intersection.
 */
function findPoiBetweenSegmentAndPlaneRegion(poi, segment, planeVertex1, planeVertex2, planeVertex3, planeVertex4) {
  return findPoiBetweenSegmentAndTriangle(poi, segment, planeVertex1, planeVertex2, planeVertex3) || findPoiBetweenSegmentAndTriangle(poi, segment, planeVertex1, planeVertex3, planeVertex4);
}

/**
 * Finds the point of intersection between a line segment and a triangle.
 *
 * This assumes the triangle is not degenerate (has non-zero side lengths).
 *
 * ----------------------------------------------------------------------------
 * Originally based on Dan Sunday's algorithms at http://geomalgorithms.com/a06-_intersect-2.html.
 *
 * Copyright 2001 softSurfer, 2012 Dan Sunday
 * This code may be freely used and modified for any purpose
 * providing that this copyright notice is included with it.
 * SoftSurfer makes no warranty for this code, and cannot be held
 * liable for any real or imagined damage resulting from its use.
 * Users of this code must verify correctness for their application.
 * ----------------------------------------------------------------------------
 *
 * @param {vec3} poi Output param. Null if there is no intersection.
 * @param {LineSegment} segment
 * @param {vec3} triangleVertex1
 * @param {vec3} triangleVertex2
 * @param {vec3} triangleVertex3
 * @returns {boolean} True if there is an intersection.
 */
function findPoiBetweenSegmentAndTriangle(poi, segment, triangleVertex1, triangleVertex2, triangleVertex3) {
  //
  // Find the point of intersection between the segment and the triangle's plane.
  //

  // First triangle edge.
  vec3.subtract(_tmpVec1, triangleVertex2, triangleVertex1);
  // Second triangle edge.
  vec3.subtract(_tmpVec2, triangleVertex3, triangleVertex1);
  // Triangle normal.
  vec3.cross(_tmpVec3, _tmpVec1, _tmpVec2);
  // Triangle to segment.
  vec3.subtract(_tmpVec4, segment.start, triangleVertex1);

  var normalToSegmentProj = vec3.dot(_tmpVec3, segment.dir);

  if (normalToSegmentProj < EPSILON && normalToSegmentProj > -EPSILON) {
    // The line segment is parallel to the triangle.
    return false;
  }

  var normalToDiffProj = -vec3.dot(_tmpVec3, _tmpVec4);
  var segmentNormalizedDistance = normalToDiffProj / normalToSegmentProj;

  if (segmentNormalizedDistance < 0 || segmentNormalizedDistance > 1) {
    // The line segment ends before intersecting the plane.
    return false;
  }

  vec3.scaleAndAdd(poi, segment.start, segment.dir, segmentNormalizedDistance);

  //
  // Determine whether the point of intersection lies within the triangle.
  //

  var edge1DotEdge1 = vec3.dot(_tmpVec1, _tmpVec1);
  var edge1DotEdge2 = vec3.dot(_tmpVec1, _tmpVec2);
  var edge2DotEdge2 = vec3.dot(_tmpVec2, _tmpVec2);
  // Triangle to point of intersection.
  vec3.subtract(_tmpVec3, poi, triangleVertex1);
  var diffDotEdge1 = vec3.dot(_tmpVec3, _tmpVec1);
  var diffDotEdge2 = vec3.dot(_tmpVec3, _tmpVec2);
  var denominator = edge1DotEdge2 * edge1DotEdge2 - edge1DotEdge1 * edge2DotEdge2;

  // Check the triangle's parametric coordinates.
  var s = (edge1DotEdge2 * diffDotEdge2 - edge2DotEdge2 * diffDotEdge1) / denominator;
  if (s < 0 || s > 1) {
    return false;
  }
  var t = (edge1DotEdge2 * diffDotEdge1 - edge1DotEdge1 * diffDotEdge2) / denominator;
  if (t < 0 || s + t > 1) {
    return false;
  }

  return true;
}

/**
 * ----------------------------------------------------------------------------
 * Originally based on Jukka Jylänki's algorithm at
 * https://github.com/juj/MathGeoLib/blob/1093e39d91def7ff6905fb7489893190d7d81353/src/Geometry/OBB.cpp.
 *
 * Copyright 2011 Jukka Jylänki
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ----------------------------------------------------------------------------
 *
 * @param {vec3} outputPoint Output parameter.
 * @param {Obb} obb
 * @param {vec3} targetPoint
 */
function findClosestPointFromObbToPoint(outputPoint, obb, targetPoint) {
  vec3.subtract(_tmpVec1, targetPoint, obb.centerOfVolume);
  vec3.copy(outputPoint, obb.centerOfVolume);
  for (var i = 0; i < 3; i++) {
    // Compute the displacement along this axis.
    var projection = vec3.dot(obb.axes[i], _tmpVec1);
    projection = projection > obb.halfSideLengths[i] ? obb.halfSideLengths[i] : projection < -obb.halfSideLengths[i] ? -obb.halfSideLengths[i] : projection;
    vec3.scaleAndAdd(outputPoint, outputPoint, obb.axes[i], projection);
  }
}

/**
 * Finds the closest position on one line segment to the other line segment, and vice versa.
 *
 * ----------------------------------------------------------------------------
 * Originally based on Jukka Jylänki's algorithm at
 * https://github.com/juj/MathGeoLib/blob/ff2d348a167008c831ae304483b824647f71fbf6/src/Geometry/LineSegment.cpp.
 *
 * Copyright 2011 Jukka Jylänki
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ----------------------------------------------------------------------------
 *
 * @param {vec3} closestA Output param.
 * @param {vec3} closestB Output param.
 * @param {LineSegment} segmentA
 * @param {LineSegment} segmentB
 */
function findClosestPointsFromSegmentToSegment(closestA, closestB, segmentA, segmentB) {
  var _findClosestPointsFro = findClosestPointsFromLineToLine(segmentA.start, segmentA.dir, segmentB.start, segmentB.dir),
      distA = _findClosestPointsFro.distA,
      distB = _findClosestPointsFro.distB;

  var isDistAInBounds = distA >= 0 && distA <= 1;
  var isDistBInBounds = distB >= 0 && distB <= 1;

  if (isDistAInBounds) {
    if (isDistBInBounds) {
      // The distances along both line segments are within bounds.
      vec3.scaleAndAdd(closestA, segmentA.start, segmentA.dir, distA);
      vec3.scaleAndAdd(closestB, segmentB.start, segmentB.dir, distB);
    } else {
      // Only the distance along the first line segment is within bounds.
      if (distB < 0) {
        vec3.copy(closestB, segmentB.start);
      } else {
        vec3.copy(closestB, segmentB.end);
      }
      findClosestPointOnSegmentToPoint(closestA, segmentA, closestB);
    }
  } else {
    if (isDistBInBounds) {
      // Only the distance along the second line segment is within bounds.
      if (distA < 0) {
        vec3.copy(closestA, segmentA.start);
      } else {
        vec3.copy(closestA, segmentA.end);
      }
      findClosestPointOnSegmentToPoint(closestB, segmentB, closestA);
    } else {
      // Neither of the distances along either line segment are within bounds.
      if (distA < 0) {
        vec3.copy(closestA, segmentA.start);
      } else {
        vec3.copy(closestA, segmentA.end);
      }

      if (distB < 0) {
        vec3.copy(closestB, segmentB.start);
      } else {
        vec3.copy(closestB, segmentB.end);
      }

      var altClosestA = vec3.create();
      var altClosestB = vec3.create();

      findClosestPointOnSegmentToPoint(altClosestA, segmentA, closestB);
      findClosestPointOnSegmentToPoint(altClosestB, segmentB, closestA);

      if (vec3.squaredDistance(altClosestA, closestB) < vec3.squaredDistance(altClosestB, closestA)) {
        vec3.copy(closestA, altClosestA);
      } else {
        vec3.copy(closestB, altClosestB);
      }
    }
  }
}

/**
 * Finds the closest position on a line segment to a point.
 *
 * ----------------------------------------------------------------------------
 * Originally based on Jukka Jylänki's algorithm at
 * https://github.com/juj/MathGeoLib/blob/ff2d348a167008c831ae304483b824647f71fbf6/src/Geometry/LineSegment.cpp.
 *
 * Copyright 2011 Jukka Jylänki
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ----------------------------------------------------------------------------
 *
 * @param {vec3} closestPoint Output param.
 * @param {LineSegment} segment
 * @param {vec3} point
 * @private
 */
function findClosestPointOnSegmentToPoint(closestPoint, segment, point) {
  var dirSquaredLength = vec3.squaredLength(segment.dir);

  if (!dirSquaredLength) {
    // The point is at the segment start.
    vec3.copy(closestPoint, segment.start);
  } else {
    // Calculate the projection of the point onto the line extending through the segment.
    vec3.subtract(_tmpVec1, point, segment.start);
    var t = vec3.dot(_tmpVec1, segment.dir) / dirSquaredLength;

    if (t < 0) {
      // The point projects beyond the segment start.
      vec3.copy(closestPoint, segment.start);
    } else if (t > 1) {
      // The point projects beyond the segment end.
      vec3.copy(closestPoint, segment.end);
    } else {
      // The point projects between the start and end of the segment.
      vec3.scaleAndAdd(closestPoint, segment.start, segment.dir, t);
    }
  }
}

/**
 * Finds the closest position on one line to the other line, and vice versa.
 *
 * The positions are represented as scalar-value distances from the "start" positions of each line.
 * These are scaled according to the given direction vectors.
 *
 * ----------------------------------------------------------------------------
 * Originally based on Jukka Jylänki's algorithm at
 * https://github.com/juj/MathGeoLib/blob/ff2d348a167008c831ae304483b824647f71fbf6/src/Geometry/Line.cpp.
 *
 * Copyright 2011 Jukka Jylänki
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ----------------------------------------------------------------------------
 *
 * @param {vec3} startA The start position of line A.
 * @param {vec3} dirA The (unnormalized) direction of line A. Cannot be zero.
 * @param {vec3} startB The start position of line B.
 * @param {vec3} dirB The (unnormalized) direction of line B. Cannot be zero.
 * @returns {{distA: Number, distB: Number}}
 */
function findClosestPointsFromLineToLine(startA, dirA, startB, dirB) {
  vec3.subtract(_tmpVec1, startA, startB);
  var dirBDotDirAToB = vec3.dot(dirB, _tmpVec1);
  var dirADotDirAToB = vec3.dot(dirA, _tmpVec1);

  var sqrLenDirB = vec3.squaredLength(dirB);
  var sqrLenDirA = vec3.squaredLength(dirA);

  var dirADotDirB = vec3.dot(dirA, dirB);

  var denominator = sqrLenDirA * sqrLenDirB - dirADotDirB * dirADotDirB;

  var distA = denominator < EPSILON ? 0 : (dirADotDirB * dirBDotDirAToB - sqrLenDirB * dirADotDirAToB) / denominator;
  var distB = (dirBDotDirAToB + dirADotDirB * distA) / sqrLenDirB;

  return {
    distA: distA,
    distB: distB
  };
}

/**
 * A good description of why we need these special operations for rotating tensors can be found
 * here: http://www.randygaul.net/2014/04/09/transformations-change-of-basis-matrix/.
 *
 * @param {mat3} output Output param.
 * @param {mat3} tensor
 * @param {quat} rotation
 */
function rotateTensor(output, tensor, rotation) {
  // TODO: Test this somehow...
  mat3.fromQuat(_tmpMat, rotation);
  mat3.multiply(output, _tmpMat, tensor);
  mat3.invert(_tmpMat, _tmpMat);
  mat3.multiply(output, output, _tmpMat);
}

/**
 * @param {Aabb} aabb
 * @param {vec3} point
 * @returns {boolean}
 */
function aabbVsPoint(aabb, point) {
  return point[0] >= aabb.minX && point[0] <= aabb.maxX && point[1] >= aabb.minY && point[1] <= aabb.maxY && point[2] >= aabb.minZ && point[2] <= aabb.maxZ;
}

/**
 * @param {quat} out
 * @param {quat} a
 * @param {quat} b
 * @param {number} scale
 * @returns {quat}
 */
function scaleAndAddQuat(out, a, b, scale) {
  return quat.set(out, a[0] + b[0] * scale, a[1] + b[1] * scale, a[2] + b[2] * scale, a[3] + b[3] * scale);
}

/**
 * @param {vec3} a
 * @param {vec3} b
 * @returns {boolean}
 */
function areVec3sClose(a, b) {
  for (var i = 0; i < 3; i++) {
    if (a[i] - b[i] > EPSILON || b[i] - a[i] > EPSILON) {
      return false;
    }
  }
  return true;
}

// Re-used across the geometry utility functions, so we don't instantiate as many vec3 objects.
var _tmpVec1 = vec3.create();
var _tmpVec2 = vec3.create();
var _tmpVec3 = vec3.create();
var _tmpVec4 = vec3.create();
var _tmpMat = mat3.create();

// Exposed to consumers, so they don't have to instantiate as many vec3 objects.
var tmpVec1 = vec3.create();
var tmpVec2 = vec3.create();
var tmpVec3 = vec3.create();
var tmpVec4 = vec3.create();

var _geometry = {
  EPSILON: EPSILON,
  HALF_PI: HALF_PI,
  TWO_PI: TWO_PI,
  scaleAndAddQuat: scaleAndAddQuat
};

exports._geometry = _geometry;
exports.tmpVec1 = tmpVec1;
exports.tmpVec2 = tmpVec2;
exports.tmpVec3 = tmpVec3;
exports.tmpVec4 = tmpVec4;
exports.findSquaredDistanceBetweenSegments = findSquaredDistanceBetweenSegments;
exports.findSquaredDistanceFromSegmentToPoint = findSquaredDistanceFromSegmentToPoint;
exports.findClosestPointFromAabbToPoint = findClosestPointFromAabbToPoint;
exports.findClosestPointFromAabbSurfaceToPoint = findClosestPointFromAabbSurfaceToPoint;
exports.findPoiBetweenSegmentAndTriangle = findPoiBetweenSegmentAndTriangle;
exports.findPoiBetweenSegmentAndPlaneRegion = findPoiBetweenSegmentAndPlaneRegion;
exports.findClosestPointFromObbToPoint = findClosestPointFromObbToPoint;
exports.findClosestPointsFromSegmentToSegment = findClosestPointsFromSegmentToSegment;
exports.findClosestPointOnSegmentToPoint = findClosestPointOnSegmentToPoint;
exports.findClosestPointsFromLineToLine = findClosestPointsFromLineToLine;
exports.rotateTensor = rotateTensor;
exports.aabbVsPoint = aabbVsPoint;
exports.areVec3sClose = areVec3sClose;

},{}],42:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createForCollidable = exports.createCapsuleInertiaTensor = exports.createBoxInertiaTensor = exports.createSphereInertiaTensor = undefined;

var _geometry2 = require('./geometry');

/**
 * @param {number} radius
 * @param {number} mass
 * @returns {mat3}
 */
function createSphereInertiaTensor(radius, mass) {
  // TODO: Test this somehow...
  var tensor = mat3.create();
  var moment = 2 / 5 * mass * radius * radius;
  tensor[0] = moment;
  tensor[4] = moment;
  tensor[8] = moment;
  return tensor;
}

/**
 * @param {number} rangeX
 * @param {number} rangeY
 * @param {number} rangeZ
 * @param {number} mass
 * @returns {mat3}
 */
/**
 * This module defines a collection of static utility functions for calculating inertia tensors.
 */

function createBoxInertiaTensor(rangeX, rangeY, rangeZ, mass) {
  // TODO: Test this somehow...
  var tensor = mat3.create();
  var tmp = mass / 12;
  var xRangeSquared = rangeX * rangeX;
  var yRangeSquared = rangeY * rangeY;
  var zRangeSquared = rangeZ * rangeZ;
  tensor[0] = tmp * (yRangeSquared + zRangeSquared);
  tensor[4] = tmp * (xRangeSquared + yRangeSquared);
  tensor[8] = tmp * (xRangeSquared + zRangeSquared);
  return tensor;
}

/**
 * ----------------------------------------------------------------------------
 * Originally based on Bojan Lovrovic's algorithm at
 * http://www.gamedev.net/page/resources/_/technical/math-and-physics/capsule-inertia-tensor-r3856.
 *
 * Copyright 2014 Bojan Lovrovic
 *
 * GameDev.net Open License
 * (http://www.gamedev.net/page/resources/_/gdnethelp/gamedevnet-open-license-r2956)
 *
 * TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION
 *
 * 1. Definitions.
 *
 * "Article" shall refer to any body of text written by Author which describes and documents the use
 * and/or operation of Source. It specifically does not refer to any accompanying Source either
 * embedded within the body of text or attached to the article as a file.
 *
 * "Author" means the individual or entity that offers the Work under the terms of this License.
 *
 * "License" shall mean the terms and conditions for use, reproduction, and distribution as defined
 * by Sections 1 through 9 of this document.
 *
 * "Licensor" shall mean the copyright owner or entity authorized by the copyright owner that is
 * granting the License.
 *
 * "You" (or "Your") shall mean an individual or entity exercising permissions granted by this
 * License.
 *
 * "Source" shall include all software text source code and configuration files used to create
 * executable software
 *
 * "Object" shall mean any Source which has been converted into a machine executable software
 *
 * "Work" consists of both the Article and Source
 *
 * "Publisher" refers to GameDev.net LLC
 *
 * This agreement is between You and Author, the owner and creator of the Work located at
 * Gamedev.net.
 *
 * 2. Fair Dealing Rights.
 *
 * Nothing in this License is intended to reduce, limit, or restrict any uses free from copyright or
 * rights arising from limitations or exceptions that are provided for in connection with the
 * copyright protection under copyright law or other applicable laws.
 *
 * 3. Grant of Copyright License.
 *
 * Subject to the terms and conditions of this License, the Author hereby grants to You a perpetual,
 * worldwide, non-exclusive, no-charge, royalty-free, irrevocable copyright license to the Work
 * under the following stated terms:
 * You may not reproduce the Article on any other website outside of Gamedev.net without express
 * written permission from the Author
 * You may use, copy, link, modify and distribute under Your own terms, binary Object code versions
 * based on the Work in your own software
 * You may reproduce, prepare derivative Works of, publicly display, publicly perform, sublicense,
 * and distribute the Source and such derivative Source in Source form only as part of a larger
 * software distribution and provided that attribution to the original Author is granted.
 * The origin of this Work must not be misrepresented; you must not claim that you wrote the
 * original Source. If you use this Source in a product, an acknowledgment of the Author name would
 * be appreciated but is not required.
 *
 * 4. Restrictions.
 *
 * The license granted in Section 3 above is expressly made subject to and limited by the following
 * restrictions:
 * Altered Source versions must be plainly marked as such, and must not be misrepresented as being
 * the original software.
 * This License must be visibly linked to from any online distribution of the Article by URI and
 * using the descriptive text "Licensed under the GameDev.net Open License"
 * Neither the name of the Author of this Work, nor any of their trademarks or service marks, may be
 * used to endorse or promote products derived from this Work without express prior permission of
 * the Author
 * Except as expressly stated herein, nothing in this License grants any license to Author's
 * trademarks, copyrights, patents, trade secrets or any other intellectual property. No license is
 * granted to the trademarks of Author even if such marks are included in the Work. Nothing in this
 * License shall be interpreted to prohibit Author from licensing under terms different from this
 * License any Work that Author otherwise would have a right to license.
 *
 * 5. Grant of Patent License.
 *
 * Subject to the terms and conditions of this License, each Contributor hereby grants to You a
 * perpetual, worldwide, non-exclusive, no-charge, royalty-free, irrevocable (except as stated in
 * this section) patent license to make, have made, use, offer to sell, sell, import, and otherwise
 * transfer the Work, where such license applies only to those patent claims licensable by such
 * Contributor that are necessarily infringed by their Contribution(s) alone or by combination of
 * their Contribution(s) with the Work to which such Contribution(s) was submitted. If You institute
 * patent litigation against any entity (including a cross-claim or counterclaim in a lawsuit)
 * alleging that the Work or Source incorporated within the Work constitutes direct or contributory
 * patent infringement, then any patent licenses granted to You under this License for that Work
 * shall terminate as of the date such litigation is filed.
 *
 * 6. Limitation of Liability.
 *
 * In no event and under no legal theory, whether in tort (including negligence), contract, or
 * otherwise, unless required by applicable law (such as deliberate and grossly negligent acts) or
 * agreed to in writing, shall any Author or Publisher be liable to You for damages, including any
 * direct, indirect, special, incidental, or consequential damages of any character arising as a
 * result of this License or out of the use or inability to use the Work (including but not limited
 * to damages for loss of goodwill, work stoppage, computer failure or malfunction, or any and all
 * other commercial damages or losses), even if such Author has been advised of the possibility of
 * such damages.
 *
 * 7. DISCLAIMER OF WARRANTY
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
 * NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * 8. Publisher.
 *
 * The parties hereby confirm that the Publisher shall not, under any circumstances, be responsible
 * for and shall not have any liability in respect of the subject matter of this License. The
 * Publisher makes no warranty whatsoever in connection with the Work and shall not be liable to You
 * or any party on any legal theory for any damages whatsoever, including without limitation any
 * general, special, incidental or consequential damages arising in connection to this license. The
 * Publisher reserves the right to cease making the Work available to You at any time without notice
 *
 * 9. Termination
 *
 * This License and the rights granted hereunder will terminate automatically upon any breach by You
 * of the terms of this License. Individuals or entities who have received Deriviative Works from
 * You under this License, however, will not have their licenses terminated provided such
 * individuals or entities remain in full compliance with those licenses. Sections 1, 2, 6, 7, 8 and
 * 9 will survive any termination of this License.
 * Subject to the above terms and conditions, the license granted here is perpetual (for the
 * duration of the applicable copyright in the Work). Notwithstanding the above, Licensor reserves
 * the right to release the Work under different license terms or to stop distributing the Work at
 * any time; provided, however that any such election will not serve to withdraw this License (or
 * any other license that has been, or is required to be, granted under the terms of this License),
 * and this License will continue in full force and effect unless terminated as stated above.
 * ----------------------------------------------------------------------------
 *
 * @param {number} halfDistance
 * @param {number} radius
 * @param {number} mass
 * @returns {mat3}
 */
function createCapsuleInertiaTensor(halfDistance, radius, mass) {
  // TODO: Test this somehow...
  var tensor = mat3.create();

  var cylinderHeight = halfDistance * 2;
  var radiusSquared = radius * radius;
  var cylinderVolume = Math.PI * radiusSquared * cylinderHeight;
  var hemisphereCombinedVolume = 4 / 3 * Math.PI * radiusSquared;
  var cylinderMass = cylinderVolume / (cylinderVolume * hemisphereCombinedVolume) * mass;
  var hemisphereMass = (mass - cylinderMass) / 2;

  // Contribution from the cylinder.
  tensor[4] = radiusSquared * cylinderMass / 2;
  tensor[0] = tensor[4] / 2 + cylinderMass * cylinderHeight * cylinderHeight / 12;
  tensor[8] = tensor[0];

  // Contributions from the hemispheres.
  var tmp1 = hemisphereMass * 2 * radiusSquared / 5;
  tensor[4] += tmp1 * 2;
  var tmp2 = (tmp1 + hemisphereMass * (halfDistance * halfDistance + 3 / 8 * cylinderHeight * radius)) * 2;
  tensor[0] += tmp2;
  tensor[8] += tmp2;

  // The above calculations assume the capsule is aligned along the y-axis. However, our default
  // capsule orientation is aligned along the z-axis.
  var rotation = quat.create();
  quat.rotateX(rotation, rotation, _geometry2._geometry.HALF_PI);
  (0, _geometry2.rotateTensor)(tensor, tensor, rotation);

  return tensor;
}

/**
 * @param {Collidable} collidable
 * @param {number} mass
 * @returns {mat3}
 */
function createForCollidable(collidable, mass) {
  switch (collidable.constructor.name) {
    case 'Sphere':
      return createSphereInertiaTensor(collidable.radius, mass);
    case 'Aabb':
      return createBoxInertiaTensor(collidable.rangeX, collidable.rangeY, collidable.rangeZ, mass);
    case 'Capsule':
      return createCapsuleInertiaTensor(collidable.halfDistance, collidable.radius, mass);
    case 'Obb':
      return createBoxInertiaTensor(collidable.halfSideLengths[0] * 2, collidable.halfSideLengths[1] * 2, collidable.halfSideLengths[2] * 2, mass);
  }
}

exports.createSphereInertiaTensor = createSphereInertiaTensor;
exports.createBoxInertiaTensor = createBoxInertiaTensor;
exports.createCapsuleInertiaTensor = createCapsuleInertiaTensor;
exports.createForCollidable = createForCollidable;

},{"./geometry":41}],43:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * This module defines a collection of static general utility functions.
 */

// TODO: This should be set from somewhere else (probably as a param to controller like before; but then I need to make this updatable)
var isInDevMode = true;

var _util = {
  isInDevMode: isInDevMode
};

exports._util = _util;

},{}]},{},[32])

//# sourceMappingURL=physx.js.map

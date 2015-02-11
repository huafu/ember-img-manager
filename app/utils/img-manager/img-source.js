import Ember from 'ember';
import helpers from './dom-helpers';

var forEach = Ember.EnumerableUtils.forEach;
var observer = Ember.observer;
var computed = Ember.computed;
var oneWay = computed.oneWay;
var on = Ember.on;

var uuid = 0;
function appendDummyQP(url) {
  if (typeof url === 'string') {
    url = url.split('#');
    if (url[0].indexOf('?') === -1) {
      url[0] += '?';
    }
    else {
      url[0] += '&';
    }
    url[0] += '__dummy_eim__=' + (++uuid);
    url = url.join('#');
  }
  return url;
}

/**
 * @module img-manager
 * @class ImgSource
 * @extends Ember.Object
 * @uses Ember.Evented
 */
export default Ember.Object.extend(Ember.Evented, {
  /**
   * How many times this source has been duplicated
   * @property hits
   * @type {number}
   */
  hits: 0,

  /**
   * The src of our image
   * @property src
   * @type {string}
   */
  src: null,

  /**
   * Our manager
   * @property manager
   * @type {ImgManagerService}
   */
  manager: null,

  /**
   * Percent loaded
   * @property progress
   * @type {number}
   */
  progress: null,

  /**
   * Our matching rule
   * @property rule
   * @type {ImgRule}
   */
  rule: computed('src', function () {
    var opt = this.getProperties('manager', 'src');
    return opt.manager.ruleForSrc(opt.src);
  }).readOnly(),

  /**
   * Are we currently loading?
   * @property isLoading
   * @type {boolean}
   */
  isLoading: true,

  /**
   * Whether the load failed or not
   * @property isError
   * @type {boolean}
   */
  isError: false,

  /**
   * Are we ready? either loaded or error
   * @property isReady
   * @type {boolean}
   */
  isReady: computed.or('isError', 'isSuccess'),

  /**
   * Whether we are loaded successfully or not
   * @property isSuccess
   * @type {boolean}
   */
  isSuccess: computed('isLoading', 'isError', function () {
    return !this.get('isLoading') && !this.get('isError');
  }).readOnly(),

  /**
   * Our source node
   * @property node
   * @type {HTMLImageElement}
   */
  node: computed('src', function () {
    return document.createElement('img');
  }).readOnly(),

  /**
   * Loads the image
   *
   * @method load
   */
  load: function () {
    var node, opt;
    if (!this._loading) {
      this._loading = true;
      opt = this.getProperties(
        'src', '_onLoadHandler', '_onErrorHandler', '_onProgressHandler', 'maxTries'
      );
      node = this.get('node');
      this.trigger('willLoad');
      if (opt.maxTries) {
        this.set('isLoading', true);
        this.set('progress', undefined);
        helpers.attachOnce(node, 'load', opt._onLoadHandler);
        helpers.attachOnce(node, 'error', opt._onErrorHandler);
        helpers.attachOnce(node, 'progress', opt._onProgressHandler);
        if (this.get('errorCount')) {
          node.src = appendDummyQP(opt.src);
        }
        else {
          node.src = opt.src;
        }
      }
      else {
        // do not even try to load the image, and directly fires the ready event
        Ember.run.next(this, function () {
          this._loading = false;
          this.setProperties({isError: true, isLoading: false});
          this.trigger('ready');
        });
      }
    }
  },

  /**
   * Maximum number of load tries
   * @property maxTries
   * @type {number}
   */
  maxTries: oneWay('rule.maxTries'),

  /**
   * Should we lazy load the image?
   * @property lazyLoad
   * @type {number}
   */
  lazyLoad: oneWay('rule.lazyLoad'),

  /**
   * Number of errors when trying to load the image
   * @property errorCount
   * @type {number}
   */
  errorCount: 0,

  /**
   * Our virtual src depending on our state
   * @property virtualSrc
   * @type {string}
   */
  virtualSrc: computed('isLoading', 'isError', 'rule.errorSrc', 'rule.loadingSrc', function () {
    var opt = this.getProperties('isLoading', 'isError');
    if (opt.isLoading) {
      return this.get('rule.loadingSrc');
    }
    else if (opt.isError) {
      return this.get('rule.errorSrc');
    }
    else {
      // use the node.src since we might have added some parameters for another try
      return this.get('node.src');
    }
  }).readOnly(),


  /**
   * All the existing clones for this image
   * @property clones
   * @type {Array.<HTMLImageElement>}
   */
  clones: computed(function () {
    return [];
  }).readOnly(),


  /**
   * Creates a new clone with given attributes
   *
   * @method createClone
   * @param {Object} attributes
   * @return {HTMLImageElement}
   */
  createClone: function (attributes) {
    var opt = this.getProperties('virtualSrc', 'clones', 'manager');
    var clone = opt.manager.cloneForSrc(opt.virtualSrc, attributes);
    opt.clones.push(clone);
    this.incrementProperty('hits');
    return clone;
  },

  /**
   * Release a clone
   *
   * @method releaseClone
   * @param {HTMLImageElement} clone
   */
  releaseClone: function (clone) {
    var opt = this.getProperties('clones', 'manager'), index = opt.clones.indexOf(clone);
    opt.clones.splice(index, 1);
    opt.manager.releaseClone(clone);
  },

  /**
   * Switch the clones' src when the ready event is fired
   *
   * @method switchClonesSrc
   */
  switchClonesSrc: observer('virtualSrc', function () {
    var opt = this.getProperties('clones', 'virtualSrc', 'manager');
    if (this._oldVirtualSrc !== opt.virtualSrc) {
      forEach(opt.clones, function (clone) {
        opt.manager.switchCloneForSrc(clone, opt.virtualSrc);
      });
      this._oldVirtualSrc = opt.virtualSrc;
    }
  }).on('ready'),


  /**
   * The progress event handler
   * @property _onProgressHandler
   * @type Function
   * @private
   */
  _onProgressHandler: computed(function () {
    return Ember.run.bind(this, function (event) {
      if (event.lengthComputable) {
        this.set('progress', event.loaded / event.total * 100);
      }
    });
  }).readOnly(),


  /**
   * The load event handler
   * @property _onLoadHandler
   * @type Function
   * @private
   */
  _onLoadHandler: computed(function () {
    return Ember.run.bind(this, function (event) {
      var opt = this.getProperties('node', '_onErrorHandler', '_onProgressHandler');
      helpers.detach(opt.node, 'error', opt._onErrorHandler);
      helpers.detach(opt.node, 'progress', opt._onProgressHandler);
      this._loading = false;
      this.setProperties({
        isError:   false,
        isLoading: false,
        progress:  100
      });
      this.trigger('didLoad', event);
      this.trigger('ready', event);
    });
  }).readOnly(),

  /**
   * The error event handler
   * @property _onErrorHandler
   * @type Function
   * @private
   */
  _onErrorHandler: computed(function () {
    return Ember.run.bind(this, function (event) {
      var opt = this.getProperties('node', '_onLoadHandler', '_onProgressHandler', 'maxTries', 'rule');
      helpers.detach(opt.node, 'load', opt._onLoadHandler);
      helpers.detach(opt.node, 'progress', opt._onProgressHandler);
      this._loading = false;
      if (this.incrementProperty('errorCount') < opt.maxTries) {
        this._continueRuleProcessingQueue();
        this.scheduleLoad(true);
      }
      else {
        // we're done trying, trigger the `didError` event
        this.setProperties({
          isError:   true,
          isLoading: false
        });
        this.trigger('didError', event);
        this.trigger('ready', event);
      }
    });
  }).readOnly(),

  /**
   * Schedule the image load
   *
   * @method scheduleLoad
   * @param {boolean} [forceReload=false]
   * @private
   */
  scheduleLoad: function (forceReload) {
    Ember.debug(
      '[img-manager] scheduling ' + (forceReload ? 're' : '') +
      'load in rule load queue for src `' + this.get('src') + '`.'
    );
    this.get('rule').scheduleForLoad(this, forceReload ? 'reload' : 'load');
  },

  /**
   * Initiate the image load
   *
   * @method reload
   * @private
   */
  reload: function () {
    this.notifyPropertyChange('src');
    this.load();
  },

  /**
   * Pauses the load processing queue
   *
   * @method _pauseRuleProcessingQueue
   * @private
   */
  _pauseRuleProcessingQueue: on('willLoad', function () {
    Ember.debug('[img-manager] pausing rule load queue for src `' + this.get('src') + '`.');
    this.get('rule').pauseLoadQueue();
  }),

  /**
   * Continues the load processing queue
   *
   * @method _continueRuleProcessingQueue
   * @private
   */
  _continueRuleProcessingQueue: on('ready', function () {
    Ember.debug('[img-manager] continuing rule load queue for src `' + this.get('src') + '`.');
    this.get('rule').continueLoadQueue();
  })

});

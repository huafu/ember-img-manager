import Ember from 'ember';
import ImgManagerInViewportMixin from '../mixins/img-manager/in-viewport';

var IMG_ATTRIBUTES = [
  'id', 'title', 'align', 'alt', 'border', 'height',
  'hspace', 'ismap', 'longdesc', 'name', 'width',
  'usemap', 'vspace'
];

var computed = Ember.computed;
var readOnly = computed.readOnly;
var oneWay = computed.oneWay;
var run = Ember.run;
var next = run.next;
var scheduleOnce = run.scheduleOnce;
var on = Ember.on;
var observer = Ember.observer;

/**
 * @class ImgWrapComponent
 * @extends Ember.Component
 *
 * @property {ImgManagerService} manager
 */
var ImgWrapComponent;
ImgWrapComponent = Ember.Component.extend(ImgManagerInViewportMixin, {
  /**
   * @inheritDoc
   */
  attributeBindings: ['style'],

  /**
   * @inheritDoc
   */
  tagName: 'span',

  /**
   * @inheritDoc
   */
  classNames: ['img-wrap'],

  /**
   * @inheritDoc
   */
  classNameBindings: ['statusClass'],

  /**
   * The css styles of our span
   * @property style
   * @type {string}
   */
  style: 'display: inline-block;',


  /**
   * The src attribute of the image
   * @property src
   * @type {string}
   */
  src: null,

  /**
   * Our image source
   * @property imgSource
   * @type {ImgSource}
   */
  imgSource: computed('src', function () {
    var opt = this.getProperties('manager', 'src');
    return opt.src ? opt.manager.imgSourceForSrc(opt.src) : null;
  }).readOnly(),

  /**
   * Is it loading the source image?
   * @property isLoading
   * @type {boolean}
   */
  isLoading: readOnly('imgSource.isLoading'),

  /**
   * Did the source image fail to load?
   * @property isError
   * @type {boolean}
   */
  isError: readOnly('imgSource.isError'),

  /**
   * Did the source image succeed to load?
   * @property isSuccess
   * @type {boolean}
   */
  isSuccess: readOnly('imgSource.isSuccess'),

  /**
   * How many percent have been loaded so far?
   * @property progress
   * @type {number}
   */
  progress: readOnly('imgSource.progress'),

  /**
   * Lazy load
   * @property lazyLoad
   * @type {boolean}
   */
  lazyLoad: oneWay('imgSource.lazyLoad'),

  /**
   * Loading class
   * @property loadingClass
   * @type {string}
   */
  loadingClass: oneWay('manager.defaultLoadingClass'),

  /**
   * Error class
   * @property errorClass
   * @type {string}
   */
  errorClass: oneWay('manager.defaultErrorClass'),

  /**
   * Success class
   * @property successClass
   * @type {string}
   */
  successClass: oneWay('manager.defaultSuccessClass'),

  /**
   * The css class related to the current status
   * @property statusClass
   * @type {string}
   */
  statusClass: computed(
    'imgSource.isLoading', 'imgSource.isError', 'imgSource.isSuccess',
    'loadingClass', 'errorClass', 'successClass',
    function () {
      var opt = this.get('imgSource').getProperties('isLoading', 'isError', 'isSuccess');
      if (opt.isLoading) {
        return this.get('loadingClass');
      }
      else if (opt.isError) {
        return this.get('errorClass');
      }
      else if (opt.isSuccess) {
        return this.get('successClass');
      }
    }).readOnly(),

  /**
   * Schedule a load when the image enters the viewport
   *
   * @method _enteredViewportHandler
   * @private
   */
  _enteredViewportHandler: on('didEnterViewport', function () {
    if (this._currentCloneSource && !this.get('imgSource.isReady')) {
      this.get('imgSource').scheduleLoad();
    }
  }),

  /**
   * Sends the correct event related to the current status
   *
   * @method _sendStatusAction
   * @private
   */
  _sendStatusAction: Ember.observer('imgSource.isError', 'imgSource.isSuccess', function () {
    if (this.get('imgSource.isError')) {
      this.sendAction('load-error');
    }
    else if (this.get('imgSource.isSuccess')) {
      this.sendAction('load-success');
    }
  }),

  /**
   * Called when the src is changed or when the element is inserted into the DOM
   *
   * @method _insertClone
   * @private
   */
  _insertClone: observer('src', function () {
    if (this._state !== 'inDOM') {
      scheduleOnce('afterRender', this, '_insertClone');
    }
    else {
      this.get('element').appendChild(this._createClone());
    }
  }).on('didInsertElement'),


  /**
   * Release the clone used if any
   *
   * @method _releaseClone
   * @private
   */
  _releaseClone: on('willDestroyElement', function () {
    var src, clone;
    src = this._currentCloneSource;
    if (src) {
      if (this._state === 'inDOM') {
        clone = this.get('element').lastChild;
        if (clone) {
          next(src, 'releaseClone', clone);
          this._currentCloneSource = null;
        }
      }
      else {
        throw new Error('[img-manager] Trying to release a clone while not in the DOM.');
      }
    }
  }),

  /**
   * Initialize our component
   *
   * @method _setupImgWrap
   * @private
   */
  _setupImgWrap: on('init', function () {
    if (!this.get('lazyLoad')) {
      this.set('enteredViewport', true);
    }
  }),

  /**
   * Create a clone after releasing the possible existing one
   *
   * @method _createClone
   * @private
   */
  _createClone: function () {
    var clone, imgSource = this.get('imgSource');
    this._releaseClone();
    if (imgSource) {
      clone = imgSource.createClone(this.getProperties(IMG_ATTRIBUTES));
      this._currentCloneSource = imgSource;
      if (this.get('enteredViewport')) {
        next(imgSource, 'scheduleLoad');
      }
    }
    return clone;
  }

});

// now create the setters for each image attribute so that we can update them on each clone
var extra = {};
Ember.EnumerableUtils.forEach(IMG_ATTRIBUTES, function (name) {
  extra[name] = computed(function (key, value) {
    var clone;
    if (arguments.length > 1 && !this.isDestroying && !this.isDestroyed && this._state === 'inDOM') {
      if (this._currentCloneSource && (clone = this.get('element').lastChild)) {
        this.get('manager').setCloneAttribute(clone, name, value);
      }
      return value;
    }
  });
});
ImgWrapComponent.reopen(extra);

export default ImgWrapComponent;

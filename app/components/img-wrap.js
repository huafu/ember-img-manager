import Ember from 'ember';

var IMG_ATTRIBUTES = [
  'id', 'title', 'align', 'alt', 'border', 'height',
  'hspace', 'ismap', 'longdesc', 'name', 'width',
  'usemap', 'vspace'
];

/**
 * @class ImgWrapComponent
 * @extends Ember.Component
 *
 * @property {ImgManagerService} manager
 */
var ImgWrapComponent = Ember.Component.extend({
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
  classNameBindings: ['imgSource.isLoading:loading', 'imgSource.isError:error'],

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
  imgSource: Ember.computed('src', function () {
    var opt = this.getProperties('manager', 'src');
    return opt.src ? opt.manager.imgSourceForSrc(opt.src) : null;
  }).readOnly(),

  /**
   * Insert our clone in the DOM
   *
   * @method _insertClone
   * @private
   */
  _insertClone: Ember.observer('src', function () {
    var clone;
    if (this._state === 'inDOM' && (clone = this._createClone())) {
      // the _createClone will also release the old one if any
      this.get('element').appendChild(clone);
    }
  }).on('didInsertElement'),

  /**
   * Release the clone used if any
   *
   * @method _releaseClone
   * @private
   */
  _releaseClone: Ember.on('willDestroyElement', function () {
    var meta = this._currentClone;
    if (meta) {
      meta.imgSource.releaseClone(meta.clone);
      this._currentClone = null;
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
      this._currentClone = {
        imgSource: imgSource,
        clone:     clone
      };
    }
    return clone;
  }

});

// now create the setters for each image attribute so that we can update them on each clone
var extra = {};
Ember.EnumerableUtils.forEach(IMG_ATTRIBUTES, function (name) {
  extra[name] = Ember.computed(function (key, value) {
    if (arguments.length > 1) {
      if (this._currentClone) {
        this.get('manager').setCloneAttribute(this._currentClone.clone, name, value);
      }
      return value;
    }
  });
});
ImgWrapComponent.reopen(extra);

export default ImgWrapComponent;

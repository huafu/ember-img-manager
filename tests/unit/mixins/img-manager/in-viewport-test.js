import Ember from 'ember';
import ImgManagerInViewportMixin from 'ember-img-manager/mixins/img-manager/in-viewport';

module('ImgManagerInViewportMixin');

// Replace this with your real tests.
test('it works', function() {
  var ImgManagerInViewportObject = Ember.Object.extend(ImgManagerInViewportMixin);
  var subject = ImgManagerInViewportObject.create();
  ok(subject);
});

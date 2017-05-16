import Ember from 'ember';
import { module, test } from 'qunit';
import startApp from '../../helpers/start-app';


let App;

module('Acceptance: should update the image after the src changed with a delay', {
  beforeEach: function () {
    App = startApp();
  },
  afterEach: function () {
    Ember.run(App, 'destroy');
  }
});

test('visiting /img-wrap/delayed-src', function (assert) {
  let $imgContainer;
  visit('/img-wrap/delayed-src');
  andThen(function () {
    fillIn('#img-src', 'assets/images/cartoon-1.jpg');
    later(100);
  });
  andThen(function () {
    assert.equal(currentPath(), 'img-wrap.delayed-src');
    $imgContainer = find('.img-container');
    assert.equal($imgContainer.find('img').attr('src'), 'assets/images/cartoon-1.jpg');
    assert.equal($imgContainer.find('img').attr('alt'), 'Cartoon 1');
  });
});

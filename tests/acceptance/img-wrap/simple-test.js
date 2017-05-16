import Ember from 'ember';
import startApp from '../../helpers/start-app';
import { module, test } from 'qunit';

let application;

module('Acceptance: should render a simple image', {
  beforeEach:    function () {
    application = startApp();
  },
  afterEach: function () {
    Ember.run(application, 'destroy');
  }
});

test('visiting /img-wrap/simple', function (assert) {
  assert.equal(true, true);
  let $imgContainer;
  visit('/img-wrap/simple');
  andThen(function(){
    later(10);
  });
  andThen(function () {
    assert.equal(currentPath(), 'img-wrap.simple');
    $imgContainer = find('.img-container');
    assert.equal($imgContainer.find('img').attr('src'), 'assets/images/cartoon-1.jpg');
    assert.equal($imgContainer.find('img').attr('alt'), 'Cartoon 1');
  });
});

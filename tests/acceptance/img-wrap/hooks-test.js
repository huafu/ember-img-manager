import Ember from 'ember';
import { module, test } from 'qunit';
import startApp from '../../helpers/start-app';


let VALID_SRC = 'assets/images/cartoon-1.jpg';
let INVALID_SRC = '__dummy_not_exists__.jpg';

let App;

module('Acceptance: should trigger the `load-success` and `load-error` hooks', {
  beforeEach:    function () {
    App = startApp();
  },
  afterEach: function () {
    Ember.run(App, 'destroy');
  }
});

test('visiting /img-wrap/hooks', function (assert) {
  let $img1Container, $img2Container, $img3Container, controller;
  visit('/img-wrap/hooks');
  andThen(function(){
    controller = controllerFor('img-wrap/hooks');
    $img1Container = find('.img-1');
    $img2Container = find('.img-2');
    $img3Container = find('.img-3');
    later(50);
  });
  andThen(function(){
    assert.ok(!controller.hooked(), 'No hook should have been called yet');
    controller.setProperties({
      imgSrc1: VALID_SRC,
      imgSrc2: VALID_SRC,
      imgSrc3: VALID_SRC
    });
    later(50);
  });
  andThen(function () {
    assert.ok(controller.hooked('success', 1), 'Success should have been called for img 1');
    assert.ok(controller.hooked('success', 2), 'Success should have been called for img 2');
    assert.ok(controller.hooked('success', 3), 'Success should have been called for img 3');
    assert.equal(controller.hookeds().length, 3, 'Only 3 hooks should have been called');
    controller.resetHooks();
    controller.setProperties({
      imgSrc1: INVALID_SRC,
      imgSrc2: INVALID_SRC,
      imgSrc3: INVALID_SRC
    });
    later(50);
  });
  andThen(function () {
    assert.ok(controller.hooked('error', 1), 'Error should have been called for img 1');
    assert.ok(controller.hooked('error', 2), 'Error should have been called for img 2');
    assert.ok(controller.hooked('error', 3), 'Error should have been called for img 3');
    assert.equal(controller.hookeds().length, 3, 'Only 3 hooks should have been called');
    controller.resetHooks();
  });
});

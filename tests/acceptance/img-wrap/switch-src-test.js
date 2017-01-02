import Ember from 'ember';
import { module, test } from 'qunit';
import startApp from '../../helpers/start-app';

var App;

module('Acceptance: should update the image after the src changed', {
  setup:    function () {
    App = startApp();
  },
  teardown: function () {
    Ember.run(App, 'destroy');
  }
});

test('visiting /img-wrap/delayed-src', function () {
  var $imgContainer;
  visit('/img-wrap/delayed-src');
  andThen(function(){
    fillIn('#img-src', 'assets/images/cartoon-1.jpg');
    later(10);
  });
  andThen(function () {
    equal(currentPath(), 'img-wrap.delayed-src');
    $imgContainer = find('.img-container');
    equal($imgContainer.find('img').attr('src'), 'assets/images/cartoon-1.jpg');
    equal($imgContainer.find('img').attr('alt'), 'Cartoon 1');
  });
  andThen(function(){
    fillIn('#img-src', 'assets/images/cartoon-2.jpg');
    later(10);
  });
  // andThen(function () {
  //   equal($imgContainer.find('img').attr('src'), 'assets/images/cartoon-2.jpg');
  //   equal($imgContainer.find('img').attr('alt'), 'Cartoon 1');
  // });
});

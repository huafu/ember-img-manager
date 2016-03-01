import Ember from 'ember';
import startApp from '../../helpers/start-app';
import {TRANSPARENT_PIXEL} from 'dummy/utils/img-manager/img-clone-holder';
import '../../helpers/later';

var application;

module('Acceptance: should update the image after the src changed', {
  setup:    function () {
    application = startApp();
  },
  teardown: function () {
    Ember.run(application, 'destroy');
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

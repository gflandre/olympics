jQuery(document).ready(function() {
  toggle_ranking();
  toggle_menu();
  setTimeout(animate_bars, 200);
});

var toggle_ranking = function() {
  jQuery('.toggle-ranking.toggle-show').click(function(e) {
    e.preventDefault();
    jQuery('.ranking.custom').hide();
    jQuery('.ranking.official').show();
    jQuery('.toggle-ranking.toggle-hide').show();
    jQuery(this).hide();
    animate_bars();
  });

  jQuery('.toggle-ranking.toggle-hide').click(function(e) {
    e.preventDefault();
    jQuery('.ranking.official').hide();
    jQuery('.ranking.custom').show();
    jQuery('.toggle-ranking.toggle-show').show();
    jQuery(this).hide();
    animate_bars();
  });
};

var toggle_menu = function() {
  var content = jQuery('#menu .content').html();

  jQuery('#menu .toggle-popover').popover({
    placement: 'bottom',
    content: content,
    container: '#menu',
    html: true
  });

  jQuery('#main').click(function(e) {
    jQuery('#menu .toggle-popover').popover('hide');
  });
};

var animate_bars = function() {
  var bars = jQuery('ul.ranking li .chart .bar');

  for(var i = 0; i < bars.length; i++) {
    var bar = bars.eq(i);
    bar.css('width', bar.attr('rel'));
  }
}

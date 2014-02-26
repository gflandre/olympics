jQuery(document).ready(function() {
  toggle_ranking();
  toggle_menu();
  setTimeout(animate_bars, 200);
});

var toggle_ranking = function() {
  jQuery('#toggle').change(function(e) {
    if(jQuery(this).is(':checked')) {
      jQuery('.toggle-ranking .official').removeClass('selected');
      jQuery('.toggle-ranking .by-population').addClass('selected');
      jQuery('.ranking.official').fadeOut(function() {
        jQuery('.ranking.custom').fadeIn();
      });
    }
    else {
      jQuery('.toggle-ranking .by-population').removeClass('selected');
      jQuery('.toggle-ranking .official').addClass('selected');
      jQuery('.ranking.custom').fadeOut(function() {
        jQuery('.ranking.official').fadeIn();
      });
    }
  });
};

var toggle_menu = function() {
  var content = jQuery('#menu .content').html();

  jQuery('#menu .toggle-popover').popover({
    placement: 'bottom',
    title: 'All Olympic Games',
    content: content,
    container: '#menu',
    html: true
  });

  jQuery('#main').click(function(e) {
    if(e.target.className === 'official') {
      if(jQuery('#toggle').is(':checked')) {
        jQuery('#toggle').click();
      }
    }
    else if(e.target.className === 'by-population') {
      if(!jQuery('#toggle').is(':checked')) {
        jQuery('#toggle').click();
      }
    }
    else {
      jQuery('#menu .toggle-popover').popover('hide');
    }
  });
};

var animate_bars = function() {
  var bars = jQuery('ul.ranking li .chart .bar');

  for(var i = 0; i < bars.length; i++) {
    var bar = bars.eq(i);
    bar.css('width', bar.attr('rel'));
  }
}

//
// # html_generator
//
var fwk = require('fwk');
var fs = require('fs');

var html_generator = function(spec, my) {
  var _super = {};
  my = my || {};

  my.DATA_FILE = 'output/data.json';
  my.TEMPLATE_DIR = 'template';
  my.OUTPUT_DIR = 'html';

  //
  // #### _public methods_
  //
  var main;                 /* main()                                     */

  //
  // #### _private methods_
  //
  var copy_static_files;    /* copy_static_files(cb_)                     */
  var replace_variable;     /* replace_variable(variable, value, content) */
  var idfy;                 /* idfy(olympic)                              */
  var bignumber;            /* bignumber(n, c, d, t)                      */
  var percentage;           /* percentage(country)                        */
  var get_ranking;          /* get_ranking(country)                       */
  var get_menu;             /* get_menu(data)                             */

  //
  // #### _that_
  //
  var that = {};


  /****************************************************************************/
  /*                                HELPERS                                   */
  /****************************************************************************/
  //
  // # copy_static_files
  //
  copy_static_files = function(cb_) {
    fs.readdir(my.TEMPLATE_DIR, function(err, directories) {
      if(err) {
        cb_(err);
      }
      else {
        fwk.async.each(directories, function(directory, ecb_) {
          if(directory === 'index.html' || directory === 'sochi.html') {
            ecb_();
          }
          else {
            fs.readdir(my.TEMPLATE_DIR + '/' + directory,
                       function(err, files) {
              if(err) {
                ecb_(err);
              }
              else {
                fwk.async.each(files, function(file, ecb_) {
                  if(file === 'olympic_template.css') {
                    ecb_();
                  }
                  else {
                    fs.readFile(my.TEMPLATE_DIR + '/' + directory + '/' + file,
                                function(err, data) {
                      if(err) {
                        ecb_(err);
                      }
                      else {
                        fs.writeFile(my.OUTPUT_DIR + '/' + directory + '/' + file,
                                     data, ecb_);
                      }
                    });
                  }
                }, ecb_);
              }
            });
          }
        }, cb_);
      }
    });
  };

  //
  // # replace_variable
  //
  replace_variable = function(variable, value, content) {
    var regexp = new RegExp('\{\{' + variable + '\}\}', 'g');
    return content.replace(regexp, value, content);
  };

  //
  // # idfy
  //
  idfy = function(olympic) {
    return olympic.city.replace('.', '').replace(/ /g, '_').toLowerCase() +
           '_' + olympic.year;
  };

  //
  // # bignumber
  //
  bignumber = function(n, c, d, t) {
    var c = isNaN(c = Math.abs(c)) ? 2 : c, d = d == undefined ? "," : d, t = t == undefined ? "." : t, s = n < 0 ? "-" : "", i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", j = (j = i.length) > 3 ? j % 3 : 0;
    return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
  };

  //
  // # percentage
  //
  percentage = function(country, first_country) {
    var val = 100 * country.score / first_country.score;
    val =  Math.round(10* Math.sqrt(val));
    return val < 1 ? 1 : val;
  };

  //
  // # get_ranking
  //
  get_ranking = function(country, first_country) {
    return '<li class="clearfix">' +
             '<div class="rank">' + country.rank + '</div>' +
             '<div class="country">' + country.country + '</div>' +
             '<div class="medal gold">' +
               '<i class="fa fa-circle"></i>' +
               country.gold +
             '</div>' +
             '<div class="medal silver">' +
               '<i class="fa fa-circle"></i>' +
               country.silver +
             '</div>' +
             '<div class="medal bronze">' +
               '<i class="fa fa-circle"></i>' +
               country.bronze +
             '</div>' +
             '<div class="population">' +
               '<i class="fa fa-male"></i>' +
               bignumber(country.population, 0, '', ',') +
             '</div>' +
             '<div class="chart">' +
               '<div class="bar" rel="' +
                 percentage(country, first_country) + '%"></div>' +
             '</div>' +
           '</li>';
  };

  //
  // # get_menu
  //
  get_menu = function(data) {
    var result = '';
    data.forEach(function(olympic) {
      if(olympic.year === 2014) {
        olympic.color = '#006ab3';
      }

      result = '<li>' +
                  '<a href="' + idfy(olympic) + '_' + olympic.season + '_olympics_medal_count_by_population.html" class="olympic" style="border-left-color:' + olympic.color + '">' +
                    olympic.city + ' ' + olympic.year +
                  '</a>' + result;
    });
    return result;
  };

  /****************************************************************************/
  /*                                GENERATOR                                 */
  /****************************************************************************/
  main = function() {
    var JSON_DATA;
    fs.readFile(my.DATA_FILE, function(err, data) {
      if(err) {
        console.log(err);
        process.exit();
      }
      else {
        try {
          JSON_DATA = JSON.parse(data);
        }
        catch(err) {
          console.log(err);
          process.exit();
        }

        copy_static_files(function(err) {
          if(err) {
            console.log(err);
            process.exit();
          }
          else {
            var menu = get_menu(JSON_DATA);
            var i = 0;
            fwk.async.eachSeries(JSON_DATA, function(olympic, ecb_) {
              var olympic_id = idfy(olympic);

              if(olympic.year < 2014) {
                fwk.async.parallel([
                  /* HTML */
                  function(pcb_) {
                    fs.readFile(my.TEMPLATE_DIR + '/index.html',
                                { encoding: 'utf8' },
                                function(err, html) {
                      if(err) {
                        pcb_(err);
                      }
                      else {
                        html = replace_variable('olympic_id', olympic_id, html);
                        
                        var previous_link = '&nbsp;';
                        if(i > 0) {
                          /* Corner case Winter 1936 */
                          if(olympic.season === 'winter' && olympic.year === 1936) {
                            html = replace_variable('special_class', 'small_title', html);
                          }
                          else if (olympic.season === 'summer' && olympic.year === 1936) {
                            html = replace_variable('special_class', 'small_next_nav', html);
                          }
                          else if (olympic.season === 'summer' && olympic.year === 1948) {
                            html = replace_variable('special_class', 'small_prev_nav', html);
                          }
                          else {
                            html = replace_variable('special_class', '', html);
                          }

                          var previous_id = idfy(JSON_DATA[i - 1]);
                          previous_link = '<a href="' + previous_id + '_' + JSON_DATA[i - 1].season + '_olympics_medal_count_by_population.html">' +
                                          '<i class="fa fa-angle-left"></i>' +
                                          JSON_DATA[i - 1].city + ' ' +
                                          JSON_DATA[i - 1].year +
                                          '</a>';
                        }
                        html = replace_variable('previous_link', previous_link, html);

                        var next_link = '&nbsp;';
                        if(i < JSON_DATA.length - 1) {
                          var next_id = idfy(JSON_DATA[i + 1]);
                          next_link = '<a href="' + next_id + '_' + JSON_DATA[i + 1].season + '_olympics_medal_count_by_population.html">' +
                                      JSON_DATA[i + 1].city + ' ' +
                                      JSON_DATA[i + 1].year +
                                      '<i class="fa fa-angle-right"></i>' +
                                      '</a>';
                        }
                        html = replace_variable('next_link', next_link, html);

                        html = replace_variable('flag', olympic.country_image, html);
                        html = replace_variable('city', olympic.city, html);
                        html = replace_variable('year', olympic.year, html);
                        html = replace_variable('season', olympic.season.charAt(0).toUpperCase() + olympic.season.slice(1), html);
                        html = replace_variable('population_year', olympic.medal_count[0].population_year, html);

                        var custom_ranking = '';
                        olympic.ranking.forEach(function(country) {
                          custom_ranking += get_ranking(country, olympic.ranking[0]);
                        });
                        html = replace_variable('custom_ranking', custom_ranking, html);

                        var official_ranking = '';
                        olympic.medal_count.forEach(function(country) {
                          official_ranking += get_ranking(country, olympic.ranking[0]);
                        });
                        html = replace_variable('official_ranking', official_ranking, html);

                        html = replace_variable('menu', menu, html);

                        fs.writeFile(my.OUTPUT_DIR + '/' + olympic_id + '_' + olympic.season + '_olympics_medal_count_by_population.html',
                                     html, pcb_)
                      }
                    });
                  },
                  /* CSS */
                  function(pcb_) {
                    fs.readFile(my.TEMPLATE_DIR + '/css/olympic_template.css',
                                { encoding: 'utf8' },
                                function(err, css) {
                      if(err) {
                        pcb_(err);
                      }
                      else {
                        css = replace_variable('color', olympic.color, css);

                        fs.writeFile(my.OUTPUT_DIR + '/css/' + olympic_id + '.css',
                                     css, pcb_);
                      }
                    });
                  }
                ], function(err) {
                  if(err) {
                    ecb_(err);
                  }
                  else {
                    console.log(olympic_id);
                    i++;
                    ecb_();
                  }
                });
              }
              else {
                ecb_();
              }
            }, function(err) {
              if(err) {
                console.log(err);
                process.exit();
              }
              else {
                console.log('DONE.');
                process.exit();
              }
            });
          }
        });
      }
    });
  };

  main();

  return that;
};

html_generator();

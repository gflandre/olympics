//
// # sochi
//
var fwk = require('fwk');
var cheerio = require('cheerio');
var http = require('http');
var fs = require('fs');

var past_data_scrapper = function(spec, my) {
  var _super = {};
  my = my || {};

  my.DATA_URL = "http://www.sochi2014.com/en/medal-standings";
  my.TEMPLATE_DIR = 'template';
  my.OUTPUT_DIR = 'html';

  //
  // #### _public methods_
  //
  var main;                 /* main()                              */

  //
  // #### _private methods_
  //
  var get_html;
  var get_score;
  var compute_ranking;
  var replace_variable;
  var bignumber;
  var percentage;
  var get_ranking;

  //
  // #### _that_
  //
  var that = {};


  /****************************************************************************/
  /*                                HELPERS                                   */
  /****************************************************************************/
  //
  // ## get_html
  //
  get_html = function(url, cb_) {
    var req = http.request(url, function(res) {
      var body = '';

      res.on('data', function(chunk) {
        body += chunk;
      });

      res.on('end', function() {
        return cb_(null, body);
      });
    });
    req.on('error', cb_);
    req.end();
  };
  
  //
  // # get_score
  //
  get_score = function(gold, silver, bronze, population) {
    return ((gold * 10000) + (silver * 100) + bronze) / population;
  };

  //
  // # compute_ranking
  //
  compute_ranking = function(countries) {
    var get_ranking = function(new_countries) {
      var previous_rank = 1;
      var previous_score = -1;
      new_countries.forEach(function(country, i) {
        if(country.score === previous_score) {
          country.rank = previous_rank;
        }
        else {
          country.rank = i + 1;
          previous_rank = i + 1;
          previous_score = country.score;
        }
      });
      return new_countries;
    };

    var result = [];
    countries.forEach(function(country) {
      var new_country = fwk.shallow(country);
      new_country.score = get_score(country.gold, country.silver,
                                    country.bronze, country.population);
      result.push(new_country);
    });

    result.sort(function(a, b) {
      return b.score - a.score;
    });

    return get_ranking(result);
  };

  //
  // # replace_variable
  //
  replace_variable = function(variable, value, content) {
    var regexp = new RegExp('\{\{' + variable + '\}\}', 'g');
    return content.replace(regexp, value, content);
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

  /****************************************************************************/
  /*                                 SCRAPPER                                 */
  /****************************************************************************/
  main = function() {
    var country_population = {
      "Albania": 3162083, "Algeria": 38481705, "Andorra": 78360,
      "Argentina": 41086927, "Armenia": 2969081, "Australia": 22683600,
      "Austria": 8462446, "Azerbaijan": 9297507, "Bahamas": 371960,
      "Belarus": 9464000, "Belgium": 11142157, "Bermuda": 64806,
      "Bosnia and Herzegovina": 3833916, "Brazil": 198656019,
      "Bulgaria": 7304632, "Canada": 34880491, "Cayman Islands": 57570,
      "Chile": 17464814, "China": 1350695000, "Chinese Taipei": 2618772,
      "Colombia": 47704427, "Croatia": 4267000, "Cyprus": 1128994,
      "Czech Republic": 10514810, "Denmark": 5590478, "DPR Korea": 24554000,
      "Eritrea": 6130922, "Estonia": 1339396, "Ethiopia": 91728849,
      "Finland": 5414293, "France": 65696689, "Georgia": 4511800,
      "Germany": 81889839, "Great Britain": 60800000, "Greece": 11280167,
      "Haiti": 10173775, "Hong Kong, CHN": 7071576, "Hungary": 9943755,
      "Iceland": 320137, "IR Iran": 76424443, "Ireland": 4588798,
      "Israel": 7907900, "Italy": 60917978, "Jamaica": 2712100,
      "Japan": 127561489, "Kazakhstan": 16797459, "Kenya": 43178141,
      "Korea": 74000000, "Kyrgyzstan": 5582100, "Latvia": 2025473,
      "Lebanon": 4424888, "Liechtenstein": 36656, "Lithuania": 2985509,
      "Luxembourg": 531441, "Madagascar": 22293914, "Malta": 418366,
      "Mexico": 120847477, "MKD": 2058539, "Monaco": 37579,
      "Mongolia": 2796484, "Montenegro": 621081, "Morocco": 32521143,
      "Netherlands": 16767705, "New Zealand": 4433100, "Norway": 5018869,
      "Pakistan": 179160111, "Peru": 29987800, "Philippines": 96706764,
      "Poland": 38542737, "Portugal": 10526703, "Puerto Rico": 3667084,
      "Rep. of Moldova": 3559500, "Romania": 21326905,
      "Russian Fed.": 143533000, "San Marino": 31247, "Senegal": 13726021,
      "Serbia": 7223887, "Slovakia": 5410267, "Slovenia": 2058152,
      "South Africa": 51189307, "Spain": 46217961, "Sweden": 9516617,
      "Switzerland": 7997152, "Tajikistan": 8008990, "Thailand": 66785001,
      "Tonga": 104941, "Turkey": 73997128, "Ukraine": 45593300,
      "United States": 313914040, "Uzbekistan": 29776850,
      "Venezuela": 29954782, "Virgin Isl, B": 27800,
      "Virgin Isl, US": 106405, "Zimbabwe": 13724317, "Dominica": 71684,
      "Nepal": 27474377, "Paraguay": 6687361, "Macedonia": 2105575,
      "Timor-Leste": 1210233, "Togo": 6642928, "Afghanistan": 29824536
    };

    var data = {
      color: '#006ab3',
      medal_count: [],
      ranking: []
    };

    get_html(my.DATA_URL, function(err, html) {
      if(err) {
        console.log(err);
        process.exit();
      }
      else {
        var $ = cheerio.load(html);

        var rows = $('.standings table tbody').children('tr');

        for(var i = 0; i < rows.length; i++) {
          var row = rows.eq(i);
          var columns = row.children('td');
          var country_data = { population_year: 2012 };

          for(var j = 0; j < columns.length; j++) {
            var column = columns.eq(j);

            if(j === 0) {
              country_data.rank = parseInt(column.text(), 10);
              if(isNaN(country_data.rank)) {
                country_data.rank = 0;
              }
            }
            else if(j === 1) {
              if(!/^Independent/.test(column.text().trim())) {
                country_data.country = column.text().trim();
                if(/Macedonia/.test(country_data.country)) {
                  country_data.country = 'Macedonia';
                }
              }
            }
            else if(j === 2) {
              country_data.gold = parseInt(column.text(), 10);
              if(isNaN(country_data.gold)) {
                country_data.gold = 0;
              }
            }
            else if(j === 3) {
              country_data.silver = parseInt(column.text(), 10);
              if(isNaN(country_data.silver)) {
                country_data.silver = 0;
              }
            }
            else if(j === 4) {
              country_data.bronze = parseInt(column.text(), 10);
              if(isNaN(country_data.bronze)) {
                country_data.bronze = 0;
              }
            }
          }

          country_data.population = country_population[country_data.country];

          if(country_data.country) {
            data.medal_count.push(country_data);
          }
        }

        data.ranking = compute_ranking(data.medal_count);

        fwk.async.parallel([
          /* HTML */
          function(pcb_) {
            fs.readFile(my.TEMPLATE_DIR + '/sochi.html',
                        { encoding: 'utf8' },
                        function(err, html) {
              if(err) {
                pcb_(err);
              }
              else {
                var custom_ranking = '';
                data.ranking.forEach(function(country) {
                  custom_ranking += get_ranking(country, data.ranking[0]);
                });
                html = replace_variable('custom_ranking', custom_ranking, html);

                var official_ranking = '';
                data.medal_count.forEach(function(country) {
                  country.score = get_score(country.gold, country.silver,
                                            country.bronze, country.population);
                  official_ranking += get_ranking(country, data.ranking[0]);
                });
                html = replace_variable('official_ranking', official_ranking, html);

                html = replace_variable('tweet',
                         "Check out Sochi 2014's Medal Count by Population - " +
                         data.ranking[0].country + " is #1!", html);

                fwk.async.parallel([
                  function(wcb_) {
                    fs.writeFile(my.OUTPUT_DIR + '/sochi-2014-winter-olympics-medal-count-by-population.html',
                                 html, wcb_);
                  },
                  function(wcb_) {
                    fs.writeFile(my.OUTPUT_DIR + '/index.html', html, wcb_);
                  }
                ], pcb_);
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
                css = replace_variable('color', data.color, css);

                fs.writeFile(my.OUTPUT_DIR + '/css/sochi_2014.css',
                             css, pcb_);
              }
            });
          }
        ], function(err) {
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
  };

  main();

  return that;
};

past_data_scrapper();

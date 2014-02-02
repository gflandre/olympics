//
// # past_data_srapper
//
// Sources:
//  * List of Olympics: Wikipedia
//  * Olympics images: Wikipedia
//  * Country flags: Wikipedia
//  * Country population: http://www.world-statistics.org/
//
var fwk = require('fwk');
var cheerio = require('cheerio');
var http = require('http');
var fs = require('fs');

var past_data_scrapper = function(spec, my) {
  var _super = {};
  my = my || {};

  my.OLYMPICS_URL = "http://en.wikipedia.org/wiki/Olympic_Games";
  my.POPULATION_URL = "http://www.world-statistics.org/php/getIndicatorMetaValues.php?code=SP.POP.TOTL";

  my.OUTPUT = 'output/data.json';

  my.DATES = {};
  var x = 1;
  for(y = 1960; y <= 2012; y++) {
    my.DATES[y] = x;
    x++;
  }

  my.COLORS = {
    summer: {
      1896: '#e1d4a0', 1900: '#e05417', 1904: '#60905e', 1908: '#ddc213',
      1912: '#f59768', 1920: '#d3422f', 1924: '#242122', 1928: '#080100',
      1932: '#0270b8', 1936: '#000000', 1948: '#000000', 1952: '#007dc5',
      1956: '#00854a', 1960: '#000000', 1964: '#ac804b', 1968: '#000000',
      1972: '#94bdf7', 1976: '#d2232a', 1980: '#19366e', 1984: '#fc3a32',
      1988: '#fcb22f', 1992: '#ea4b38', 1996: '#005b55', 2000: '#f15a29',
      2004: '#5499e8', 2008: '#d71921', 2012: '#df0094'
    },
    winter: {
      1924: '#426756', 1928: '#d41002', 1932: '#7590c6', 1936: '#676567',
      1948: '#2e2c2d', 1952: '#000000', 1956: '#006898', 1960: '#df2732',
      1964: '#d2232a', 1968: '#daa17b', 1972: '#98a2a1', 1976: '#d2232a',
      1980: '#0084ce', 1984: '#ff4100', 1988: '#b52929', 1992: '#e42343',
      1994: '#334c99', 1998: '#74017d', 2002: '#f58735', 2006: '#00abe6',
      2010: '#00a551'
    }
  }; 

  //
  // #### _public methods_
  //
  var main;                 /* main()                              */

  //
  // #### _private methods_
  //
  var get_html;             /* get_html(url, cb_)                  */
  var get_olympics;         /* get_olympics(html)                  */
  var get_olympic_image;    /* get_olympic_image(html)             */
  var get_country_image;    /* get_country_image(html)             */
  var get_medal_count_url;  /* get_medal_count_url(html)           */
  var get_medal_count;      /* get_medal_count(html)               */
  var get_country_code      /* get_country_code(country_code)      */
  var get_population;       /* get_population(country_code, year,  */
                            /*                population_data)     */
  var get_score;            /* get_score(gold, silver,             */
                            /*           bronze, population)       */
  var compute_ranking;      /* compute_ranking(countries)          */

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
  // ## get_olympics
  //
  get_olympics = function(html) {
    var olympics = [];
    var $ = cheerio.load(html);
    var rows = $('.wikitable').children('tr');

    for(var i = 0; i < rows.length; i++) {
      var row = rows.eq(i);
      var columns = row.children('td');
      var year;
      var olympic_data_summer = null;
      var olympic_data_winter = null;

      for(var j = 0; j < columns.length; j++) {
        var column = columns.eq(j);
        if(j === 0) {
          year = parseInt(column.text(), 10);
        }
        else if(j === 1 && column.text().trim() !== '' &&
                !/Intercalated/.test(column.text()) && year <= 2014) {
          olympic_data_summer = { season: 'summer' };
          olympic_data_summer.year = year;
          olympic_data_summer.color = my.COLORS['summer'][year];
          olympic_data_summer.url = 'http://en.wikipedia.org' +
                                    column.children('a').eq(0).attr('href');
          olympic_data_summer.number = column.children('a').eq(0).text();
        }
        else if(j === 2 && olympic_data_summer && column.text().trim() !== '' &&
                year <= 2014) {
          if(!/cancelled/.test(column.text().toLowerCase())) {
            olympic_data_summer.country = column.children('.flagicon').eq(0)
                                                .children('a').eq(0)
                                                .attr('title');
            olympic_data_summer.country_url = 'http://en.wikipedia.org' +
                                              column.children('.flagicon')
                                                    .eq(0).children('a').eq(0)
                                                    .attr('href');

            var city_p = /(.+)\,\s.*/.exec(column.text());
            if(city_p) {
              olympic_data_summer.city = city_p[1].slice(1).trim();
            }
          }
        }
        else if(j === 3 && column.text().trim() !== '' && year <= 2014) {
          olympic_data_winter = { season: 'winter' };
          olympic_data_winter.year = year;
          olympic_data_winter.color = my.COLORS['winter'][year];
          olympic_data_winter.url = 'http://en.wikipedia.org' +
                                    column.children('a').eq(0).attr('href');
          olympic_data_winter.number = column.children('a').eq(0).text();
        }
        else if(j === 4 && column.text().trim() !== '' && year <= 2014) {
          if(!/cancelled/.test(column.text().toLowerCase())) {
            olympic_data_winter.country = column.children('.flagicon').eq(0)
                                                .children('a').eq(0)
                                                .attr('title');
            olympic_data_winter.country_url = 'http://en.wikipedia.org' +
                                              column.children('.flagicon')
                                                    .eq(0).children('a').eq(0)
                                                    .attr('href');

            var city_p = /(.+)\,\s.*/.exec(column.text());
            if(city_p) {
              olympic_data_winter.city = city_p[1].slice(1).trim();
            }
          }
        }
      }
      if(olympic_data_summer && olympic_data_summer.city) {
        olympics.push(olympic_data_summer);
      }
      if(olympic_data_winter && olympic_data_winter.city) {
        olympics.push(olympic_data_winter);
      }
    }

    return olympics;
  };

  //
  // ## get_olympic_image
  //
  get_olympic_image = function(html) {
    var $ = cheerio.load(html);
    var url = $('.infobox').children('tr').eq(0)
                           .children('td').eq(0)
                           .children('a').eq(0)
                           .children('img').eq(0).attr('src');
    return 'http:' + url;
  };

  //
  // ## get_country_image
  //
  get_country_image = function(html) {
    var $ = cheerio.load(html);
    var get_flag = function(line_number) {
      return $('.infobox').children('tr').eq(line_number)
                          .children('td').eq(0)
                          .children('table').eq(0)
                          .children('tr').eq(0)
                          .children('td').eq(0)
                          .children('a').eq(0)
                          .children('img').eq(0).attr('src');
    };
    var url = get_flag(1);
    if(!url) {
      url = get_flag(2);
    }

    return 'http:' + url.replace('125', '250');
  };

  //
  // ## get_medal_count_url
  //
  get_medal_count_url = function(html) {
    var $ = cheerio.load(html);

    var seealsos = $('#mw-content-text').children('.rellink');

    for(var i = 0; i < seealsos.length; i++) {
      var seealso = seealsos.eq(i);
      if(/medal table/.test(seealso.children('a').eq(0).text())) {
        return 'http://en.wikipedia.org' +
                seealso.children('a').eq(0).attr('href');
      }
    }
    return null;
  };

  //
  // ## get_medal_count
  //
  get_medal_count = function(html) {
    var $ = cheerio.load(html);
    var results = [];

    var rows = $('.wikitable.sortable').children('tr');
    var prev_rank = null;

    for(var i = 0; i < rows.length; i++) {
      var row = rows.eq(i);
      var columns = row.children('td');
      var country_columns = row.children('th'); /* London 2012 corner case */
      var country = {};

      for(var j = 0; j < columns.length; j++) {
        var column = columns.eq(j);
        var country_column = country_columns.eq(0);
        var col = j;

        if(j === 0 && ((columns.length < 6 && country_columns.length === 0) ||
                      (columns.length < 5 && country_columns.length > 0))) {
          country.rank = prev_rank;
          col++;
        }

        if(col === 0) {
          country.rank = parseInt(column.text().trim(), 10);
          prev_rank = country.rank;
        }
        else if(col === 1) {
          var country_p = /(.+)\s\((\w+)\)/.exec(column.text());
          if(country_p && !/team/i.test(country_p[1])) {
            country.country = country_p[1].substr(1);
            country.country_code = country_p[2];
          }
          else if(country_column.length > 0) { /* London 2012 corner case */
            var country_p = /(.+)\s\((\w+)\)/.exec(country_column.text());
            if(country_p && !/team/i.test(country_p[1])) {
              country.country = country_p[1].substr(1);
              country.country_code = country_p[2];
            }
            country.gold = parseInt(column.text().trim(), 10);
          }
        }
        else if(col === 2) {
          if(country_column.length > 0) { /* London 2012 corner case */
            country.silver = parseInt(column.text().trim(), 10);
          }
          else {
            country.gold = parseInt(column.text().trim(), 10);
          }
        }
        else if(col === 3) {
          if(country_column.length > 0) { /* London 2012 corner case */
            country.bronze = parseInt(column.text().trim(), 10);
          }
          else {
            country.silver = parseInt(column.text().trim(), 10);
          }
        }
        else if(col === 4 && country_column.length === 0) {
          country.bronze = parseInt(column.text().trim(), 10);
        }
      }

      if(country.country) {
        results.push(country);
      }
    }
    return results;
  };

  //
  // # get_country_code
  //
  get_country_code = function(country_code) {
    var country_codes = {
      'GER': 'DEU', 'NED': 'NLD', 'DEN': 'DNK', 'MGL': 'MNG', 'SUI': 'CHE',
      'ZIM': 'ZWE', 'SLO': 'SVN', 'BUL': 'BGR', 'INA': 'IDN', 'LAT': 'LVA',
      'POR': 'PRT', 'IRI': 'IRQ', 'CRO': 'HRV', 'GRE': 'GRC', 'TRI': 'TTO',
      'NGR': 'NGA', 'ALG': 'DZA', 'BAH': 'BHS', 'MAS': 'MYS', 'RSA': 'ZAF',
      'SIN': 'SGP', 'SUD': 'SSD', 'VIE': 'VNM', 'MRI': 'MUS', 'TOG': 'TGO',
      'GRN': 'GRD', 'PUR': 'PRI', 'BOT': 'BWA', 'GUA': 'GTM', 'KSA': 'SAU',
      'KUW': 'KWT', 'YUG': 'SRB', 'URU': 'URY', 'SRI': 'LKA', 'CRC': 'CRI',
      'BAR': 'BRB', 'UAE': 'ARE', 'SCG': 'SRB', 'TPE': 'CHN', 'PAR': 'PRY',
      'BOH': 'CZE', 'ANZ': 'AUS', 'RU1': 'RUS', 'TCH': 'CZE', 'HAI': 'HTI',
      'PHI': 'PHL', 'CEY': 'LKA', 'URS': 'RUS', 'LIB': 'LBN', 'EUA': 'DEU',
      'ROC': 'CHN', 'BWI': 'JAM', 'GDR': 'DEU', 'FRG': 'DEU', 'BER': 'BMU',
      'TAN': 'TZA', 'ZAM': 'ZMB', 'AHO': 'NLD', 'ISV': 'VIR', 'IOP': 'SRB',
      'NIG': 'NER', 'TGA': 'TON'
    };
    return country_codes[country_code] || country_code;
  };

  //
  // # get_population
  //
  get_population = function(country_code, year, population_data) {
    var population = 0;
    var index = 0;

    /* Corner case Yugoslavia */
    if(country_code === 'YUG' && year < 1990) {
      year = 1990;
    }

    do{
      if(population_data[index][0] === get_country_code(country_code)) {
        population = parseInt(population_data[index][my.DATES[year]], 10);
      }
      index++;
    }
    while (population === 0 && index <= population_data.length - 1);

    if(population === 0) {
      console.log("NOT FOUND: " + country_code);
    }

    return population;
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

  /****************************************************************************/
  /*                                 SCRAPPER                                 */
  /****************************************************************************/
  main = function() {

    var JSON_DATA = {};

    fwk.async.waterfall([
      /* Get list of olympics */
      function(wcb_) {
        get_html(my.OLYMPICS_URL, function(err, html) {
          if(err) {
            wcb_(err);
          }
          else {
            console.log('olympics');
            JSON_DATA = get_olympics(html);
            wcb_();
          }
        });
      },
      /* Get olympics image URLS */
      function(wcb_) {
        fwk.async.each(JSON_DATA, function(olympic, ecb_) {
          get_html(olympic.url, function(err, html) {
            if(err) {
              ecb_(err);
            }
            else {
              console.log('image', olympic.country, olympic.year);
              olympic.image = get_olympic_image(html);
              ecb_();
            }
          });
        }, wcb_);
      },
    /* Get country image URLS */
      function(wcb_) {
        fwk.async.each(JSON_DATA, function(olympic, ecb_) {
          get_html(olympic.country_url, function(err, html) {
            if(err) {
              ecb_(err);
            }
            else {
              console.log('country', olympic.country, olympic.year);
              olympic.country_image = get_country_image(html);
              ecb_();
            }
          });
        }, wcb_);
      },
      /* Get olympics medal counts */
      function(wcb_) {
        fwk.async.each(JSON_DATA, function(olympic, ecb_) {
          get_html(olympic.url, function(err, html) {
            if(err) {
              ecb_(err);
            }
            else {
              console.log('medals', olympic.country, olympic.year);
              olympic.medal_count_url = get_medal_count_url(html);
              if(olympic.medal_count_url) {
                get_html(olympic.medal_count_url, function(err, html) {
                  if(err) {
                    ecb_(err);
                  }
                  else {
                    console.log('count', olympic.country, olympic.year);
                    olympic.medal_count = get_medal_count(html);
                    ecb_();
                  }
                });
              }
              else {
                ecb_();
              }
            }
          });
        }, wcb_);
      },
      /* Get participating countries population at time of olympics */
      function(wcb_) {
        get_html(my.POPULATION_URL, function(err, population_data) {
          if(err) {
            wcb_(err);
          }
          else {
            try{
              population_data = population_data.substr(1);
              population_data =
                population_data.substr(0, population_data.length - 1);
              population_data = JSON.parse(population_data);
              population_data.splice(0, 3);

              fwk.async.each(JSON_DATA, function(olympic, ecb_) {
                console.log('populations', olympic.country, olympic.year);
                if(olympic.medal_count) {
                  fwk.async.each(olympic.medal_count, function(country, ccb_) {
                    country.population_year =
                      olympic.year < 1960 ? 1960 : olympic.year;
                    country.population = get_population(country.country_code,
                                                        country.population_year,
                                                        population_data);
                    ccb_();
                  }, ecb_);
                }
                else {
                  ecb_();
                }
              }, wcb_);
            }
            catch(err) {
              wcb_(err);
            }
          }
        });
      },
      /* Compute population ranking */
      function(wcb_) {
        fwk.async.each(JSON_DATA, function(olympic, ecb_) {
          console.log('compute', olympic.country, olympic.year);
          if(olympic.medal_count) {
            olympic.medal_count.forEach(function(country){
              country.score = get_score(country.gold, country.silver,
                                        country.bronze, country.population);
            });
            olympic.ranking = compute_ranking(olympic.medal_count);
          }
          ecb_();
        }, wcb_);
      }
    ], function(err, result) {
      if(err) {
        console.log(err);
        process.exit(0);
      }
      else {
        fs.writeFile(my.OUTPUT, JSON.stringify(JSON_DATA), function(err) {
          if(err) {
            console.log(err);
            process.exit(0);
          }
          else {
            console.log('DONE.');
            process.exit(1);
          }
        });
      }
    });
  };

  main();

  return that;
};

past_data_scrapper();

var Simulator, Synthesizer, async, express, fs, mkdirp, path, rmdir, router, shortid;

express = require('express');

router = express.Router();

path = require('path');

fs = require('fs');

shortid = require('shortid');

mkdirp = require('mkdirp');

rmdir = require('rimraf');

async = require('async');

Synthesizer = require('../modules/synthesizer');

Simulator = require('../modules/simulator');

router.post('/compile', function(req, res, next) {
  var netlistName, options, stdcell, synthesisFiles, synthesisFolderName, synthesisFolderPath, topModule, topModuleContent, topModuleFileId;
  synthesisFiles = req.body.files;
  stdcell = req.body.stdcell;
  options = req.body.options;
  netlistName = req.body.name;
  topModule = req.body.topModule;
  topModuleFileId = req.body.topModuleFileId;
  topModuleContent = '';
  synthesisFolderName = ((new Date()).getTime()) + "_" + (shortid.generate()) + "_" + (Math.random().toString().slice(2));
  synthesisFolderPath = path.join(process.cwd(), "temp/" + synthesisFolderName);
  return mkdirp(synthesisFolderPath, {
    mode: 0x1b6
  }, function(err) {
    var writtenFiles;
    if (err) {
      console.error(err);
      return res.status(500).json({
        error: 'An error occurred while creating the repository structure.'
      });
    } else {
      writtenFiles = [];
      return async.eachSeries(synthesisFiles, (function(file, callback) {
        var fileFolderPath;
        fileFolderPath = path.join(synthesisFolderPath, file.name + "_" + ((new Date()).getTime()) + "_" + (shortid.generate()) + "_" + (Math.random().toString().slice(2)));
        return mkdirp(fileFolderPath, {
          mode: 0x1b6
        }, function(err) {
          var filePath;
          if (err) {
            console.error(err);
            return callback('An error occurred while creating the repository structure.');
          } else {
            filePath = path.join(fileFolderPath, file.name);
            return fs.writeFile(filePath, file.content, function(err) {
              if (err) {
                console.error(err);
                return callback('An error occurred while creating the repository structure.');
              } else {
                writtenFiles.push(filePath);
                if (file.id === topModuleFileId) {
                  topModuleContent = file.content;
                }
                return callback();
              }
            });
          }
        });
      }), function(err) {
        var netlistFolderPath;
        if (err) {
          return res.status(500).json(err);
        } else {
          netlistFolderPath = path.join(synthesisFolderPath, netlistName + "_" + ((new Date()).getTime()) + "_" + (shortid.generate()) + "_" + (Math.random().toString().slice(2)));
          return mkdirp(netlistFolderPath, {
            mode: 0x1b6
          }, function(err) {
            var netlistPath, synthOptions;
            if (err) {
              console.error(err);
              return res.status(500).json({
                error: 'An error occurred while creating the repository structure.'
              });
            } else {
              netlistPath = path.join(netlistFolderPath, netlistName);
              synthOptions = {
                flatten: true,
                purge: true,
                proc: true,
                memorymap: true
              };
              if (options != null) {
                if ((options.flatten != null) && !options.flatten) {
                  synthOptions.flatten = false;
                }
                if ((options.purge != null) && !options.purge) {
                  synthOptions.purge = false;
                }
                if ((options.proc != null) && !options.proc) {
                  synthOptions.proc = false;
                }
                if ((options.memorymap != null) && !options.memorymap) {
                  synthOptions.memorymap = false;
                }
              }
              return Synthesizer.synthesize(synthesisFolderPath, writtenFiles, topModule, topModuleContent, stdcell, synthOptions, netlistPath, function(err, synthContent, synthLog) {
                rmdir(synthesisFolderPath, function(err) {
                  if (err) {
                    return console.error(err);
                  }
                });
                if (err) {
                  return res.status(500).json(err);
                } else {
                  if (synthLog.errors.length === 0) {
                    return res.status(200).json({
                      netlist: synthContent,
                      log: synthLog
                    });
                  } else {
                    return res.status(200).json({
                      netlist: null,
                      log: synthLog
                    });
                  }
                }
              });
            }
          });
        }
      });
    }
  });
});

router.post('/simulate', function(req, res, next) {
  var dumpName, reverseMap, simulationFiles, simulationFolderName, simulationFolderPath, testbenchId, testbenchPath, vcdName;
  simulationFiles = req.body.files;
  vcdName = req.body.name;
  testbenchId = req.body.testbenchId;
  testbenchPath = '';
  dumpName = '';
  simulationFolderName = ((new Date()).getTime()) + "_" + (shortid.generate()) + "_" + (Math.random().toString().slice(2));
  simulationFolderPath = path.join(process.cwd(), "temp/" + simulationFolderName);
  reverseMap = {};
  return mkdirp(simulationFolderPath, {
    mode: 0x1b6
  }, function(err) {
    var writtenFiles;
    if (err) {
      console.error(err);
      return res.status(500).json({
        error: 'An error occurred while creating the repository structure.'
      });
    } else {
      writtenFiles = [];
      return async.eachSeries(simulationFiles, (function(file, callback) {
        var fileFolderPath;
        fileFolderPath = path.join(simulationFolderPath, file.name + "_" + ((new Date()).getTime()) + "_" + (shortid.generate()) + "_" + (Math.random().toString().slice(2)));
        return mkdirp(fileFolderPath, {
          mode: 0x1b6
        }, function(err) {
          var filePath, finishAppend, matches, moduleRegEx;
          if (err) {
            console.error(err);
            return callback('An error occurred while creating the repository structure.');
          } else {
            filePath = path.join(fileFolderPath, file.name);
            reverseMap[filePath] = {
              sourceName: file.name,
              sourceId: file.id
            };
            if (file.id === testbenchId) {
              testbenchPath = filePath;
              dumpName = file.name + "_" + (Date.now()) + ".vcd";
              moduleRegEx = /([\s\S]*?)(module)([\s\S]+?)(endmodule)([\s\S]*)/gm;
              moduleRegEx = /([\s\S]*?)(module)([\s\S]+?)(\([\s\S]*\))?;([\s\S]+?)(endmodule)([\s\S]*)/gm;
              matches = moduleRegEx.exec(file.content);
              if (matches == null) {
                return callback({
                  error: 'The testbench does not contain any module.'
                });
              }
              finishAppend = "";
              if (!/[^\s\/*]\s*\$finish/.test(matches[5])) {
                finishAppend = "\n#1000;\n$finish;\n";
              }
              file.content = "" + matches[1] + matches[2] + " " + matches[3] + " " + (matches[4] ? matches[4] : '') + ";" + matches[5] + "\ninitial begin $dumpfile(\"" + dumpName + "\"); $dumpvars(0, " + matches[3] + "); " + finishAppend + "end\n" + matches[6] + matches[7];
            }
            return fs.writeFile(filePath, file.content, function(err) {
              if (err) {
                console.error(err);
                return callback('An error occurred while creating the repository structure.');
              } else {
                writtenFiles.push(filePath);
                return callback();
              }
            });
          }
        });
      }), function(err) {
        var vcdFilePath;
        if (err) {
          return res.status(500).json(err);
        } else {
          vcdFilePath = path.join(simulationFolderPath, vcdName + "_" + ((new Date()).getTime()) + "_" + (shortid.generate()) + "_" + (Math.random().toString().slice(2)));
          return mkdirp(vcdFilePath, {
            mode: 0x1b6
          }, function(err) {
            var vcdPath;
            if (err) {
              console.error(err);
              return res.status(500).json({
                error: 'An error occurred while creating the repository structure.'
              });
            } else {
              vcdPath = path.join(vcdFilePath, vcdName);
              return Simulator.simulate(simulationFolderPath, writtenFiles, testbenchPath, reverseMap, dumpName, function(err, simulationErrors, simulationWarnings, simulationLog, vcd) {
                rmdir(simulationFolderPath, function(err) {
                  if (err) {
                    return console.error(err);
                  }
                });
                if (err) {
                  return res.status(500).json(err);
                } else {
                  if ((vcd == null) || vcd.trim() === '') {
                    return res.json({
                      errors: simulationErrors,
                      warnings: simulationWarnings,
                      log: simulationLog
                    });
                  } else {
                    return Simulator.generateWave(vcd, function(err, wave) {
                      if (err) {
                        return res.status(500).json(err);
                      } else {
                        if (simulationLog.length) {
                          if (/^\s*VCD info\:\s*dumpfile/i.test(simulationLog[simulationLog.length - 1])) {
                            simulationLog.pop();
                          }
                        }
                        return res.status(200).json({
                          errors: simulationErrors,
                          warnings: simulationWarnings,
                          log: simulationLog,
                          wave: wave
                        });
                      }
                    });
                  }
                }
              });
            }
          });
        }
      });
    }
  });
});

router.get('/stdcell', function(req, res, next) {
  var stdcellsPath;
  stdcellsPath = path.join(process.cwd(), 'modules/stdcells');
  return fs.readdir(stdcellsPath, function(err, stdcellFiles) {
    if (err) {
      console.error(err);
      return res.status(500).json({
        error: 'An error has occurred while attempting to retrieve the standard cell library.'
      });
    } else {
      return res.status(200).json({
        stdcell: stdcellFiles
      });
    }
  });
});

router.get('/', function(req, res, next) {
  return res.render('index', {
    title: 'Workspace'
  });
});

module.exports = router;

//# sourceMappingURL=maps/index.js.map
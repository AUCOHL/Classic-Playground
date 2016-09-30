var Parser, exec, execFile, fs, generateWave, path, rmdir, shortid, simulate;

fs = require('fs');

path = require('path');

exec = require('child_process').exec;

execFile = require('child_process').execFile;

shortid = require('shortid');

rmdir = require('rimraf');

Parser = require('./parser');

generateWave = function(vcdContent, cb) {
  var dirName, fullPath, scriptPath, sourcePath, vcdName;
  dirName = shortid.generate() + '_' + Date.now();
  vcdName = shortid.generate() + '_' + Date.now();
  fullPath = path.join(process.cwd(), "temp/" + dirName);
  sourcePath = path.join(fullPath, vcdName);
  scriptPath = path.join(process.cwd(), "modules");
  return fs.mkdir(fullPath, 0x1b6, function(err) {
    if (err) {
      console.error(err);
      return cb({
        error: 'Failed to get process VCD file.'
      });
    } else {
      return fs.writeFile(sourcePath, vcdContent, function(err) {
        var cmd;
        if (err) {
          console.error(err);
          return cb({
            error: 'Failed to get process VCD file.'
          });
          return rmdir(sourcePath, function(err) {
            if (err) {
              return console.error(err);
            }
          });
        } else {
          cmd = "perl vcd2js.pl " + sourcePath;
          return exec(cmd, {
            cwd: scriptPath,
            maxBuffer: 50000 * 1024,
            timeout: 3000
          }, function(err, stdout, stderr) {
            var e, waveJSON;
            rmdir(sourcePath, function(err) {
              if (err) {
                return console.error(err);
              }
            });
            if (err) {
              console.error(err);
              return cb({
                error: "Failed to generate wave form."
              });
            } else {
              try {
                stdout = stdout.replace(/,\s*\]/gm, ']');
                stdout = stdout.replace(/,\s*\}/gm, '}');
                stdout = stdout.replace(/\\/gm, '\\\\');
                waveJSON = JSON.parse(stdout);
                return cb(null, waveJSON);
              } catch (error) {
                e = error;
                console.error(e);
                return cb({
                  error: "Failed to parse the generated wave."
                });
              }
            }
          });
        }
      });
    }
  });
};

simulate = function(filesPath, filesArray, fullPath, nameMap, dumpName, cb) {
  var errorParsingRegEx, innerErrorRegEx, vvpName;
  errorParsingRegEx = function() {
    return new RegExp('(.+)\\s*\\:\\s*(\\d+)\\s*\\:\\s*(.+)', 'gm');
  };
  innerErrorRegEx = function() {
    return new RegExp('\\s*(\\w+)\\s*\\:\\s*(.+)', 'igm');
  };
  vvpName = (Date.now()) + ".vvp";
  return fs.exists(fullPath, function(exists) {
    if (!exists) {
      return cb({
        error: 'Verilog file does not exists.'
      });
    } else {
      if (filesArray.length === 0) {
        return cb({
          error: "No files detected for simulation."
        });
      }
      return fs.readFile(fullPath, 'UTF-8', function(err, content) {
        var cmd, i, j, names, ref, simulatorProc, tbModules, topModule;
        if (err) {
          console.error(err);
          return cb({
            error: 'Failed to read testbench file.'
          });
        } else {
          tbModules = Parser.extractModules(content);
          if (tbModules.length === 0) {
            return cb({
              error: 'Cannot extract top module.'
            });
          }
          if (tbModules.length > 1) {
            return cb({
              error: 'Only one top module per testbench is supported.'
            });
          }
          topModule = tbModules[0];
          names = filesArray[0].replace(/\\/gm, '\\\\');
          for (i = j = 1, ref = filesArray.length; 1 <= ref ? j < ref : j > ref; i = 1 <= ref ? ++j : --j) {
            names = names + " " + (filesArray[i].replace(/\\/gm, '\\\\'));
          }
          cmd = "iverilog " + names + " -s " + topModule + " -Wall -o " + vvpName;
          console.log(cmd);
          return simulatorProc = exec(cmd, {
            cwd: filesPath,
            maxBuffer: 5000 * 1024,
            timeout: 10000
          }, function(err, stdout, stderr) {
            var errorLines, errorMatches, extractionRegEx, file, k, len, line, lineErr, logEntry, synthErrors, synthWarnings, type, typeMatches, vvpProc;
            if (err) {
              if (!stderr) {
                console.error(err);
                return cb({
                  error: "An error occurred while building."
                });
              }
            }
            if (stdout) {
              if (process.env.NODE_ENV === 'development') {
                console.log('stdout:');
                console.log(stdout);
                console.log('----end of stdout-----');
              }
            }
            synthErrors = [];
            synthWarnings = [];
            if (stderr) {
              errorLines = stderr.trim().split('\n');
              for (k = 0, len = errorLines.length; k < len; k++) {
                line = errorLines[k];
                if (line.trim() === '' || /^i give up\.$/i.test(line.trim())) {
                  continue;
                }
                logEntry = {
                  message: line.trim()
                };
                extractionRegEx = errorParsingRegEx();
                errorMatches = extractionRegEx.exec(line);
                logEntry.file = null;
                logEntry.line = 0;
                if (errorMatches !== null) {
                  file = errorMatches[1];
                  line = errorMatches[2];
                  lineErr = errorMatches[3];
                  if (innerErrorRegEx().test(lineErr)) {
                    typeMatches = innerErrorRegEx().exec(lineErr);
                    type = typeMatches[1].toLowerCase();
                    lineErr = innerErrorRegEx().exec(lineErr)[2];
                  }
                  lineErr = lineErr.charAt(0).toUpperCase() + lineErr.slice(1);
                  if (nameMap[file] != null) {
                    logEntry.file = nameMap[file].sourceId;
                    logEntry.line = Number.parseInt(line);
                    if (!/error/i.test(type) && !/[\s\S]+\s*\:\s*syntax error/i.test(logEntry.message)) {
                      synthWarnings.push(logEntry);
                    } else {
                      synthErrors.push(logEntry);
                    }
                  } else {
                    synthErrors.push(logEntry);
                  }
                } else {
                  synthErrors.push(logEntry);
                }
              }
              if (err && !synthErrors.length) {
                synthErrors.push('Fatal error has occurred during simulation.');
              }
              if (synthErrors.length > 0) {
                return cb(null, synthErrors, synthWarnings, []);
              }
            }
            return vvpProc = execFile('vvp', [vvpName], {
              cwd: filesPath,
              maxBuffer: 5000 * 1024,
              timeout: 10000
            }, function(err, stdout, stderr) {
              var l, len1, simErrors, simWarnings, vcdPath;
              if (err) {
                if (!stderr) {
                  console.error(err);
                  return cb({
                    error: "An error occurred while simulating."
                  });
                }
              }
              if (stdout) {
                if (process.env.NODE_ENV === 'development') {
                  console.log('stdout:');
                  console.log(stdout);
                  console.log('----end of stdout-----');
                }
              }
              simErrors = [];
              simWarnings = [];
              if (stderr) {
                errorLines = stderr.trim().split('\n');
                for (l = 0, len1 = errorLines.length; l < len1; l++) {
                  line = errorLines[l];
                  if (line.trim() === '' || /^i give up\.$/i.test(line.trim())) {
                    continue;
                  }
                  logEntry = {
                    message: line.trim()
                  };
                  extractionRegEx = errorParsingRegEx();
                  errorMatches = extractionRegEx.exec(line);
                  logEntry.file = null;
                  logEntry.line = 0;
                  if (errorMatches !== null) {
                    file = errorMatches[1];
                    line = errorMatches[2];
                    lineErr = errorMatches[3];
                    if (innerErrorRegEx().test(lineErr)) {
                      typeMatches = innerErrorRegEx().exec(lineErr);
                      type = typeMatches[1].toLowerCase();
                      lineErr = innerErrorRegEx().exec(lineErr)[2];
                    }
                    lineErr = lineErr.charAt(0).toUpperCase() + lineErr.slice(1);
                    logEntry.file = nameMap[file].sourceId;
                    logEntry.line = Number.parseInt(line);
                    if (!/error/i.test(type) && !/[\s\S]+\s*\:\s*syntax error/i.test(logEntry.message)) {
                      simWarnings.push(logEntry);
                    } else {
                      simErrors.push(logEntry);
                    }
                  } else {
                    simErrors.push(logEntry);
                  }
                }
                if (simErrors.length > 0) {
                  return cb(null, synthErrors.concat(simErrors), synthWarnings.concat(simWarnings), []);
                }
              }
              vcdPath = path.join(filesPath, dumpName);
              return fs.readFile(vcdPath, 'UTF-8', function(err, content) {
                if (err) {
                  console.error(err);
                  return cb({
                    error: 'Failed to read synthesized file.'
                  });
                } else {
                  return cb(null, synthErrors.concat(simErrors), synthWarnings.concat(simWarnings), stdout.split('\n').filter(function(line) {
                    return line.trim() !== '';
                  }), content);
                }
              });
            });
          });
        }
      });
    }
  });
};

module.exports = {
  generateWave: generateWave,
  simulate: simulate
};

//# sourceMappingURL=maps/simulator.js.map

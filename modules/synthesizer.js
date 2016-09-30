var Parser, exec, fs, mathjs, path, rmdir, shortid, synthesize;

fs = require('fs');

path = require('path');

exec = require('child_process').exec;

shortid = require('shortid');

rmdir = require('rimraf');

mathjs = require('mathjs');

Parser = require('./parser');

synthesize = function(filesPath, filesArray, topModule, topModuleContent, stdcell, synthOptions, synthName, cb) {
  if (synthName == null) {
    synthName = 'synth.v';
  }
  return Parser.moduleExistsInFile(topModuleContent, topModule, function(err, exists) {
    var abcPath, args, cmd, e, file, flattenOpt, memorymapOpt, procOpt, purgeOpt, stat, stdcellOpt, stdcellPath;
    if (err) {
      return cb(err);
    } else if (!exists) {
      return cb({
        error: "Module '" + topModule + "' does not exist."
      });
    } else {
      stdcellOpt = '';
      flattenOpt = '';
      purgeOpt = '';
      procOpt = '';
      memorymapOpt = '';
      if (synthOptions.flatten) {
        flattenOpt = "-p flatten";
      }
      if (synthOptions.purge) {
        purgeOpt = "-p 'opt_clean -purge'";
      }
      if (synthOptions.proc) {
        procOpt = "-p proc";
      }
      if (synthOptions.memorymap) {
        memorymapOpt = "-p memory_collect -p memory_map";
      }
      stdcellPath = '';
      if ((stdcell != null) && stdcell.trim() !== '') {
        stdcellPath = path.join(process.cwd(), "modules/stdcells/" + stdcell);
        try {
          stat = fs.lstatSync(stdcellPath);
          abcPath = stdcellPath;
          stdcellOpt = "-p 'dfflibmap -liberty " + stdcellPath + "' -p 'abc -liberty " + abcPath + "'";
        } catch (error) {
          e = error;
          console.error(e);
          return cb({
            error: "Cannot find the standard cell library " + stdcell
          });
        }
      } else {
        return cb({
          error: 'Missing standard cell library file.'
        });
      }
      args = (function() {
        var i, len, results;
        results = [];
        for (i = 0, len = filesArray.length; i < len; i++) {
          file = filesArray[i];
          results.push("-p 'read_verilog " + file + "'");
        }
        return results;
      })();
      args = args.join(' ');
      cmd = "yosys -q " + args + " -p 'hierarchy -check -top " + topModule + "' " + procOpt + " -p opt -p techmap -p opt " + stdcellOpt + " -p clean " + memorymapOpt + " " + flattenOpt + " " + purgeOpt + "  -p 'write_verilog -noattr -noexpr " + synthName + "'";
      console.log(cmd);
      return exec(cmd, {
        cwd: filesPath,
        maxBuffer: 5000 * 1024,
        timeout: 30000
      }, function(err, stdout, stderr) {
        var errorEntry, errorLines, errors, i, len, line, warningEntry, warnings;
        if (err) {
          if (!stderr) {
            console.error(err);
            return cb({
              error: "An error occurred while synthesizing."
            });
          }
        }
        if (stdout) {
          if (process.env.NODE_ENV === 'development') {
            console.log('stdout:');
            console.log(stdout);
          }
        }
        errors = [];
        warnings = [];
        if (stderr) {
          errorLines = stderr.split('\n');
          for (i = 0, len = errorLines.length; i < len; i++) {
            line = errorLines[i];
            if (line.trim() === '' || /^i give up\.$/i.test(line.trim())) {
              continue;
            }
            if (/warning *\: *([\s\S]*)/im.test(line)) {
              warningEntry = {};
              warningEntry.file = null;
              warningEntry.message = line;
              warningEntry.line = 0;
              warnings.push(warningEntry);
            } else {
              errorEntry = {};
              errorEntry.file = null;
              errorEntry.message = line;
              errorEntry.line = 0;
              errors.push(errorEntry);
            }
          }
          if (errors.length > 0) {
            return cb(null, '', {
              errors: errors,
              warnings: warnings
            });
          }
        }
        return fs.readFile(synthName, 'UTF-8', function(err, content) {
          if (err) {
            return cb({
              error: 'Failed to read synthesized file.'
            });
          } else {
            return cb(null, content, {
              errors: errors,
              warnings: warnings
            });
          }
        });
      });
    }
  });
};

module.exports = {
  synthesize: synthesize
};

//# sourceMappingURL=maps/synthesizer.js.map

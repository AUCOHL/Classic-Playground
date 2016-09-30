var extractModules, moduleExists, moduleExistsInFile;

moduleExistsInFile = function(content, module, cb) {
  return cb(null, moduleExists(content, module));
};

moduleExists = function(content, module) {
  var commentsRegEx, extractionRegEx, moduleMatches, moduleName, moduleRegEx, multiCommentsRegEx;
  commentsRegEx = function() {
    return new RegExp('\\/\\/.*$', 'gm');
  };
  multiCommentsRegEx = function() {
    return new RegExp('\\/\\*(.|[\\r\\n])*?\\*\\/', 'gm');
  };
  moduleRegEx = function() {
    return new RegExp('^\\s*module\\s+(.+?)\\s*(#\\s*\\(([\\s\\S]+?)\\)\\s*)??\\s*((\\([\\s\\S]*?\\))?\\s*;)([\\s\\S]*?)endmodule', 'gm');
  };
  content = content.replace(commentsRegEx(), '').replace(multiCommentsRegEx(), '');
  extractionRegEx = moduleRegEx();
  moduleMatches = extractionRegEx.exec(content);
  while (moduleMatches !== null) {
    moduleName = moduleMatches[1];
    if (moduleName === module) {
      return true;
    }
    moduleMatches = extractionRegEx.exec(content);
  }
  return false;
};

extractModules = function(content) {
  var commentsRegEx, extractionRegEx, moduleMatches, moduleNames, moduleRegEx, multiCommentsRegEx;
  commentsRegEx = function() {
    return new RegExp('\\/\\/.*$', 'gm');
  };
  multiCommentsRegEx = function() {
    return new RegExp('\\/\\*(.|[\\r\\n])*?\\*\\/', 'gm');
  };
  moduleRegEx = function() {
    return new RegExp('^\\s*module\\s+(.+?)\\s*(#\\s*\\(([\\s\\S]+?)\\)\\s*)??\\s*((\\([\\s\\S]*?\\))?\\s*;)$', 'gm');
  };
  content = content.replace(commentsRegEx(), '').replace(multiCommentsRegEx(), '');
  extractionRegEx = moduleRegEx();
  moduleMatches = extractionRegEx.exec(content);
  moduleNames = [];
  while (moduleMatches !== null) {
    if (moduleMatches[1] != null) {
      moduleNames.push(moduleMatches[1]);
    }
    moduleMatches = extractionRegEx.exec(content);
  }
  return moduleNames;
};

module.exports = {
  moduleExists: moduleExists,
  moduleExistsInFile: moduleExistsInFile,
  extractModules: extractModules
};

//# sourceMappingURL=maps/parser.js.map

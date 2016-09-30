

moduleExistsInFile = (content, module, cb) ->
	cb null, moduleExists(content, module)


moduleExists = (content, module) ->
	commentsRegEx = -> new RegExp '\\/\\/.*$', 'gm'
	multiCommentsRegEx = -> new RegExp '\\/\\*(.|[\\r\\n])*?\\*\\/', 'gm'
	moduleRegEx = -> new RegExp '^\\s*module\\s+(.+?)\\s*(#\\s*\\(([\\s\\S]+?)\\)\\s*)??\\s*((\\([\\s\\S]*?\\))?\\s*;)([\\s\\S]*?)endmodule', 'gm'

	content = content.replace(commentsRegEx(), '').replace(multiCommentsRegEx(), '')
	extractionRegEx = moduleRegEx()
	moduleMatches = extractionRegEx.exec(content)
	while moduleMatches isnt null
		moduleName = moduleMatches[1]
		if moduleName is module
			return yes
		moduleMatches = extractionRegEx.exec(content)
	no

extractModules = (content) ->
	commentsRegEx = -> new RegExp '\\/\\/.*$', 'gm'
	multiCommentsRegEx = -> new RegExp '\\/\\*(.|[\\r\\n])*?\\*\\/', 'gm'
	moduleRegEx = -> new RegExp '^\\s*module\\s+(.+?)\\s*(#\\s*\\(([\\s\\S]+?)\\)\\s*)??\\s*((\\([\\s\\S]*?\\))?\\s*;)$', 'gm'


	content = content.replace(commentsRegEx(), '').replace(multiCommentsRegEx(), '')
	extractionRegEx = moduleRegEx()
	moduleMatches = extractionRegEx.exec(content)
	moduleNames = []
	while moduleMatches isnt null
		if moduleMatches[1]?
			moduleNames.push moduleMatches[1]
		moduleMatches = extractionRegEx.exec(content)
	moduleNames

module.exports =
	moduleExists: moduleExists
	moduleExistsInFile: moduleExistsInFile
	extractModules: extractModules

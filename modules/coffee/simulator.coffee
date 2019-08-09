fs = require 'fs'
path = require 'path'
exec = require('child_process').exec
execFile = require('child_process').execFile
shortid = require 'shortid'
rmdir = require 'rimraf'

Parser = require './parser'


generateWave = (vcdContent, cb) ->
	dirName = shortid.generate() + '_' + Date.now()
	vcdName = shortid.generate() + '_' + Date.now()
	fullPath = path.join process.cwd(), "temp/#{dirName}"
	sourcePath = path.join fullPath, vcdName
	scriptPath = path.join process.cwd(), "modules"

	fs.mkdir fullPath, 0o0755, (err) ->
		if err
			console.error err
			return cb error: 'Failed to get process VCD file.'
		else
			fs.writeFile sourcePath, vcdContent, (err) ->
				if err
					console.error err
					return cb error: 'Failed to get process VCD file.'
					rmdir sourcePath, (err) -> console.error err if err
				else
					cmd = "perl vcd2js.pl #{sourcePath}"
					exec cmd,
						cwd: scriptPath
						maxBuffer: 50000 * 1024
						timeout: 3000,
						(err, stdout, stderr) ->
							rmdir sourcePath, (err) -> console.error err if err
							if err
								console.error err
								return cb error: "Failed to generate wave form."
							else
								try
									stdout = stdout.replace /,\s*\]/gm, ']'
									stdout = stdout.replace /,\s*\}/gm, '}'
									stdout = stdout.replace /\\/gm, '\\\\'
									waveJSON = JSON.parse stdout
									cb null, waveJSON
								catch e
									console.error e
									cb error: "Failed to parse the generated wave."





simulate = (filesPath, filesArray, fullPath, nameMap, dumpName, cb) ->
	errorParsingRegEx = -> new RegExp('(.+)\\s*\\:\\s*(\\d+)\\s*\\:\\s*(.+)', 'gm')
	innerErrorRegEx = -> new RegExp('\\s*(\\w+)\\s*\\:\\s*(.+)', 'igm')

	vvpName = "#{Date.now()}.vvp"
	fs.exists fullPath, (exists) ->
		if not exists
			cb error: 'Verilog file does not exists.'
		else
			if filesArray.length is 0
				return cb error: "No files detected for simulation."


			fs.readFile fullPath, 'UTF-8', (err, content) ->
				if err
					console.error err
					cb error: 'Failed to read testbench file.'
				else
					tbModules = Parser.extractModules content
					if tbModules.length is 0
						return cb error: 'Cannot extract top module.'
					if tbModules.length > 1
						return cb error: 'Only one top module per testbench is supported.'
					topModule = tbModules[0]

					names = filesArray[0].replace /\\/gm, '\\\\'

					for i in [1...filesArray.length]
						names = "#{names} #{filesArray[i].replace /\\/gm, '\\\\'}"

					cmd = "iverilog -s #{topModule} -Wall -o '#{vvpName}' #{names}"
					console.log cmd

					simulatorProc = exec cmd,
						cwd: filesPath
						maxBuffer: 5000 * 1024
						timeout: 10000,
						(err, stdout, stderr) ->
							if err
								if not stderr
									console.error err
									return cb error: "An error occurred while building."
							if stdout
								if process.env.NODE_ENV is 'development'
									console.log 'stdout:'
									console.log stdout
									console.log '----end of stdout-----'

							synthErrors = []
							synthWarnings = []

							if stderr
								errorLines = stderr.trim().split '\n'
								for line in errorLines
									continue if line.trim() is '' or /^i give up\.$/i.test(line.trim())
									logEntry =
										message: line.trim()
									extractionRegEx = errorParsingRegEx()
									errorMatches = extractionRegEx.exec line
									logEntry.file = null
									logEntry.line = 0
									if errorMatches isnt null
										file = errorMatches[1]
										line = errorMatches[2]
										lineErr = errorMatches[3]
										if innerErrorRegEx().test lineErr
											typeMatches = innerErrorRegEx().exec lineErr
											type = typeMatches[1].toLowerCase()
											lineErr = innerErrorRegEx().exec(lineErr)[2]
										lineErr = lineErr.charAt(0).toUpperCase() + lineErr.slice(1);

										if nameMap[file]?
											logEntry.file = nameMap[file].sourceId
											logEntry.line = Number.parseInt line
											if not /error/i.test(type) and not /[\s\S]+\s*\:\s*syntax error/i.test(logEntry.message)
												synthWarnings.push logEntry
											else
												synthErrors.push logEntry
										else
											synthErrors.push logEntry
									else
										synthErrors.push logEntry
								synthErrors.push 'Fatal error has occurred during simulation.' if err and not synthErrors.length
								return cb null, synthErrors, synthWarnings, [] if synthErrors.length > 0
							vvpProc = execFile 'vvp',
								[vvpName],
								cwd: filesPath
								maxBuffer: 5000 * 1024
								timeout: 10000,
								(err, stdout, stderr) ->
									if err
										if not stderr
											console.error err
											return cb error: "An error occurred while simulating."
									if stdout
										if process.env.NODE_ENV is 'development'
											console.log 'stdout:'
											console.log stdout
											console.log '----end of stdout-----'

									simErrors = []
									simWarnings = []

									if stderr
										errorLines = stderr.trim().split '\n'
										for line in errorLines
											continue if line.trim() is '' or /^i give up\.$/i.test(line.trim())
											logEntry =
												message: line.trim()
											extractionRegEx = errorParsingRegEx()
											errorMatches = extractionRegEx.exec line
											logEntry.file = null
											logEntry.line = 0
											if errorMatches isnt null
												file = errorMatches[1]
												line = errorMatches[2]
												lineErr = errorMatches[3]
												if innerErrorRegEx().test lineErr
													typeMatches = innerErrorRegEx().exec lineErr
													type = typeMatches[1].toLowerCase()
													lineErr = innerErrorRegEx().exec(lineErr)[2]
												lineErr = lineErr.charAt(0).toUpperCase() + lineErr.slice(1);
												logEntry.file = nameMap[file].sourceId
												logEntry.line = Number.parseInt line
												if not /error/i.test(type) and not /[\s\S]+\s*\:\s*syntax error/i.test(logEntry.message)
													simWarnings.push logEntry
												else
													simErrors.push logEntry
											else
												simErrors.push logEntry
										return cb null, synthErrors.concat(simErrors), synthWarnings.concat(simWarnings), []  if simErrors.length > 0
									vcdPath = path.join filesPath, dumpName
									fs.readFile vcdPath, 'UTF-8', (err, content) ->
										if err
											console.error err
											cb error: 'Failed to read synthesized file.'
										else
											cb null, synthErrors.concat(simErrors), synthWarnings.concat(simWarnings), stdout.split('\n').filter((line) -> line.trim() isnt ''), content

module.exports =
	generateWave: generateWave
	simulate: simulate

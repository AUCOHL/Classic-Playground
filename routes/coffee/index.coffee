express = require 'express'
router = express.Router()

path = require 'path'
fs = require 'fs'
shortid = require 'shortid'
mkdirp = require 'mkdirp'
rmdir = require 'rimraf'
async = require 'async'

Synthesizer = require '../modules/synthesizer'
Simulator = require '../modules/simulator'


router.post '/compile', (req, res, next) ->
	synthesisFiles = req.body.files
	stdcell = req.body.stdcell
	options = req.body.options
	netlistName = req.body.name
	topModule = req.body.topModule
	topModuleFileId = req.body.topModuleFileId
	topModuleContent = ''
	synthesisFolderName = "#{(new Date()).getTime()}_#{shortid.generate()}_#{(Math.random().toString().slice(2))}"
	synthesisFolderPath = path.join process.cwd(), "temp/#{synthesisFolderName}"
	mkdirp synthesisFolderPath, mode: 0o0666, (err) ->
		if err
			console.error err
			return res.status(500).json error: 'An error occurred while creating the repository structure.'
		else
			writtenFiles = []
			async.eachSeries synthesisFiles, ((file, callback) ->
				fileFolderPath = path.join synthesisFolderPath, "#{file.name}_#{(new Date()).getTime()}_#{shortid.generate()}_#{(Math.random().toString().slice(2))}"
				mkdirp fileFolderPath, mode: 0o0666, (err) ->
					if err
						console.error err
						return callback 'An error occurred while creating the repository structure.'
					else
						filePath = path.join fileFolderPath, file.name
						fs.writeFile filePath, file.content, (err) ->
							if err
								console.error err
								return callback 'An error occurred while creating the repository structure.'
							else
								writtenFiles.push filePath
								if file.id is topModuleFileId
									topModuleContent = file.content
								callback()
			), (err) ->
				if err
					return res.status(500).json err
				else
					netlistFolderPath = path.join synthesisFolderPath, "#{netlistName}_#{(new Date()).getTime()}_#{shortid.generate()}_#{(Math.random().toString().slice(2))}"
					mkdirp netlistFolderPath, mode: 0o0666, (err) ->
						if err
							console.error err
							return res.status(500).json error: 'An error occurred while creating the repository structure.'
						else
							netlistPath = path.join netlistFolderPath, netlistName

							synthOptions =
								flatten: yes
								purge: yes
								proc: yes
								memorymap: yes
							if options?
								if options.flatten? and not options.flatten
									synthOptions.flatten = no
								if options.purge? and not options.purge
									synthOptions.purge = no
								if options.proc? and not options.proc
									synthOptions.proc = no
								if options.memorymap? and not options.memorymap
									synthOptions.memorymap = no
							Synthesizer.synthesize synthesisFolderPath, writtenFiles, topModule, topModuleContent, stdcell, synthOptions, netlistPath, (err, synthContent, synthLog) ->
								rmdir synthesisFolderPath, (err) -> console.error err if err
								if err
									return res.status(500).json err
								else
									if synthLog.errors.length is 0
										return res.status(200).json
											netlist: synthContent
											log: synthLog
									else
										return res.status(200).json
													netlist: null
													log: synthLog


router.post '/simulate', (req, res, next) ->
	simulationFiles = req.body.files
	vcdName = req.body.name
	testbenchId = req.body.testbenchId
	testbenchPath = ''
	dumpName = ''
	simulationFolderName = "#{(new Date()).getTime()}_#{shortid.generate()}_#{(Math.random().toString().slice(2))}"
	simulationFolderPath = path.join process.cwd(), "temp/#{simulationFolderName}"
	reverseMap = {}
	mkdirp simulationFolderPath, mode: 0o0666, (err) ->
		if err
			console.error err
			return res.status(500).json error: 'An error occurred while creating the repository structure.'
		else
			writtenFiles = []
			async.eachSeries simulationFiles, ((file, callback) ->
				fileFolderPath = path.join simulationFolderPath, "#{file.name}_#{(new Date()).getTime()}_#{shortid.generate()}_#{(Math.random().toString().slice(2))}"
				mkdirp fileFolderPath, mode: 0o0666, (err) ->
					if err
						console.error err
						return callback 'An error occurred while creating the repository structure.'
					else
						filePath = path.join fileFolderPath, file.name
						reverseMap[filePath] =
							sourceName: file.name
							sourceId: file.id
						if file.id is testbenchId
							testbenchPath = filePath
							dumpName = "#{file.name}_#{Date.now()}.vcd"
							moduleRegEx = /([\s\S]*?)(module)([\s\S]+?)(endmodule)([\s\S]*)/gm
							moduleRegEx = /([\s\S]*?)(module)([\s\S]+?)(\([\s\S]*\))?;([\s\S]+?)(endmodule)([\s\S]*)/gm
							matches = moduleRegEx.exec file.content
							if not matches?
								return callback error: 'The testbench does not contain any module.'
							finishAppend = ""
							if not /[^\s\/*]\s*\$finish/.test matches[5]
								finishAppend = "\n#1000;\n$finish;\n"
							file.content = "#{matches[1]}#{matches[2]} #{matches[3]} #{if matches[4] then matches[4] else ''};#{matches[5]}\ninitial begin $dumpfile(\"#{dumpName}\"); $dumpvars(0, #{matches[3]}); #{finishAppend}end\n#{matches[6]}#{matches[7]}"
						fs.writeFile filePath, file.content, (err) ->
							if err
								console.error err
								return callback 'An error occurred while creating the repository structure.'
							else
								writtenFiles.push filePath
								callback()
			), (err) ->
				if err
					return res.status(500).json err
				else
					vcdFilePath = path.join simulationFolderPath, "#{vcdName}_#{(new Date()).getTime()}_#{shortid.generate()}_#{(Math.random().toString().slice(2))}"
					mkdirp vcdFilePath, mode: 0o0666, (err) ->
						if err
							console.error err
							return res.status(500).json error: 'An error occurred while creating the repository structure.'
						else
							vcdPath = path.join vcdFilePath, vcdName
							Simulator.simulate simulationFolderPath, writtenFiles, testbenchPath, reverseMap, dumpName, (err, simulationErrors, simulationWarnings, simulationLog, vcd) ->
								rmdir simulationFolderPath, (err) -> console.error err if err
								if err
									return res.status(500).json err
								else
									if not vcd? or vcd.trim() is ''
										return res.json
											errors: simulationErrors
											warnings: simulationWarnings
											log: simulationLog

									else
										Simulator.generateWave vcd, (err, wave) ->
											if err
												res.status(500).json err
											else
												if simulationLog.length
													if /^\s*VCD info\:\s*dumpfile/i.test simulationLog[simulationLog.length - 1]
														simulationLog.pop()
												res.status(200).json
																	errors: simulationErrors
																	warnings: simulationWarnings
																	log: simulationLog
																	wave: wave
router.get '/stdcell', (req, res, next) ->
	stdcellsPath = path.join process.cwd(), 'modules/stdcells'
	fs.readdir stdcellsPath, (err, stdcellFiles) ->
		if err
			console.error err
			return res.status(500).json error: 'An error has occurred while attempting to retrieve the standard cell library.'
		else
			res.status(200).json stdcell: stdcellFiles

router.get '/', (req, res, next) ->
	return res.render 'index', title: 'Workspace'

module.exports = router

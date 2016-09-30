fs = require 'fs'
path = require 'path'
exec = require('child_process').exec;
shortid = require 'shortid'
rmdir = require 'rimraf'
mathjs = require 'mathjs'

Parser = require './parser'

synthesize = (filesPath, filesArray, topModule, topModuleContent, stdcell, synthOptions, synthName = 'synth.v', cb) ->

	Parser.moduleExistsInFile topModuleContent, topModule, (err, exists) ->
		if err
			return cb err
		else if not exists
			return cb error: "Module '#{topModule}' does not exist."
		else
			stdcellOpt = ''
			flattenOpt = ''
			purgeOpt = ''
			procOpt = ''
			memorymapOpt = ''

			if synthOptions.flatten
				flattenOpt = "-p flatten"
			if synthOptions.purge
				purgeOpt = "-p 'opt_clean -purge'"
			if synthOptions.proc
				procOpt = "-p proc"
			if synthOptions.memorymap
				memorymapOpt = "-p memory_collect -p memory_map"

			stdcellPath = ''
			if stdcell? and stdcell.trim() isnt ''
				stdcellPath = path.join process.cwd(), "modules/stdcells/#{stdcell}"
				try
					stat = fs.lstatSync stdcellPath
					abcPath = stdcellPath
					stdcellOpt = "-p 'dfflibmap -liberty #{stdcellPath}' -p 'abc -liberty #{abcPath}'"
				catch e
					console.error e
					return cb error: "Cannot find the standard cell library #{stdcell}"
			else
				return cb error: 'Missing standard cell library file.'
			args = for file in filesArray
				"-p 'read_verilog #{file}'"
			args = args.join(' ')

			cmd = "yosys -q #{args} -p 'hierarchy -check -top #{topModule}' #{procOpt} -p opt -p techmap -p opt #{stdcellOpt} -p clean #{memorymapOpt} #{flattenOpt} #{purgeOpt}  -p 'write_verilog -noattr -noexpr #{synthName}'"
			console.log cmd
			exec cmd,
				cwd: filesPath
				maxBuffer: 5000 * 1024
				timeout: 30000,
				(err, stdout, stderr) ->
					if err
						if not stderr
							console.error err
							return cb error: "An error occurred while synthesizing."
					if stdout
						if process.env.NODE_ENV is 'development'
							console.log 'stdout:'
							console.log stdout
					errors = []
					warnings = []
					if stderr
						errorLines = stderr.split '\n'
						for line in errorLines
							continue if line.trim() is '' or /^i give up\.$/i.test(line.trim())
							if /warning *\: *([\s\S]*)/im.test(line)
								warningEntry = {}
								warningEntry.file = null
								warningEntry.message = line
								warningEntry.line = 0
								warnings.push warningEntry
							else
								errorEntry = {}
								errorEntry.file = null
								errorEntry.message = line
								errorEntry.line = 0
								errors.push errorEntry
						if errors.length > 0
							return cb null, '',
											errors: errors
											warnings: warnings


					fs.readFile synthName, 'UTF-8', (err, content) ->
						if err
							cb error: 'Failed to read synthesized file.'
						else
							return cb null, content,
											errors: errors
											warnings: warnings

module.exports =
	synthesize: synthesize

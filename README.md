# ☁️ Cloud V Classic Playground
A lightweight version of the IDE with no persistent file storage.

It still does fully support simulation and synthesis, making it rather useful as a playground.

# Dependencies
* Node 10
    * Using [tj/n](https://github.com/tj/n) might help
* [IcarusVerilog](http://iverilog.icarus.com)
* [Yosys](http://www.clifford.at/yosys/)

## Installing Dependencies
### macOS
Get [Homebrew](https://brew.sh) then execute:
```bash
brew install yosys icarus-verilog n
sudo n 10
```

### Debian-based Linuces
```bash
sudo apt-get -y install yosys iverilog
sudo curl -L https://git.io/n-install | bash
sudo n 10
```

# Usage
First of all, run `npm install` to install all dependencies.

You can run `npm run build` to build the Coffeescript components and the frontend.

To launch the app, invoke `npm run start`, where you can then visit the link printed to the terminal in your browser.

You can configure the environment variables `PORT` and `CV_IP` to your liking, i.e. `PORT=8080 npm run start`, for example.

# Dev Notes
The original coffee code for the frontend has been lost to time, sadly. 

# ⚖️ License
Apache 2.0, or at your option, any later version. Check 'LICENSE'.

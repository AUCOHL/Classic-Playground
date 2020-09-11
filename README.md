# ☁️ Cloud V Lite
Lightweight version of the IDE.

This IDE does not support persistent file storage, but does fully support simulation and synthesis, making it rather useful as a playground.

# Dependencies
* Node LTS (10.15.3)
    * Using [tj/n](https://github.com/tj/n) might help
* [IcarusVerilog](http://iverilog.icarus.com)
* [Yosys](http://www.clifford.at/yosys/)

## Installing
### macOS
Get [Homebrew](https://brew.sh) then execute:
```bash
brew install yosys icarus-verilog n
sudo n 10.15.3
```

### Debian-based Linuces
```bash
sudo apt-get -y install yosys iverilog
sudo curl -L https://git.io/n-install | bash
sudo n 10.15.3
```

# Usage
First of all, run `npm install` to install all dependencies.

You can run `npm run build` to build the Coffeescript components.

To launch the app, invoke `npm run start`, where you can then visit the link printed to the terminal in your browser.

You can configure the environment variables `PORT` and `CV_IP` to your liking, i.e. `PORT=8080 npm run start`, for example.

# ⚖️ License
Apache 2.0, or at your option, any later version. Check 'LICENSE'.

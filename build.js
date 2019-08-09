const { exec } = require('child_process');
const { promisify } = require('util');

async function main() {
    let promises = [
        promisify(exec)("./node_modules/coffeescript/bin/coffee --compile --output ./routes ./routes/coffee/*"),
        promisify(exec)("./node_modules/coffeescript/bin/coffee --compile --output ./modules ./modules/coffee/*")
    ];
    
    await promises.forEach(async promise=> {
        await promise;
    })
}

main().catch(error=> {
    console.error("Failed to compile")
    console.error(error)
    process.exit(65)
})
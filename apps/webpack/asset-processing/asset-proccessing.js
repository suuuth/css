const fs = require('fs');

const processPackageFiles = () => {

    let packageLocations = [];
    let aliases = [];
    let frontendCssAssets = [];
    let frontendJsAssets = [];
    let backendCssAssets = [];
    let backendJsAssets = [];

    let packageDependencies = [];
    let sortedPackageDependencies = {};

    let topPackageFile = fs.readFileSync('/apps/webpack/package.json', 'utf8');
    let packageFiles = fs.readdirSync('/public_html/packages', {});
    packageFiles.forEach((folder) => {
        if (fs.existsSync('/public_html/packages/' + folder + '/package.json')) {
            packageLocations.push({
                name: folder,
                path: '/public_html/packages/' + folder,
                file: '/public_html/packages/' + folder + '/package.json'
            });
        }
    });
    let topPackageFileJson = JSON.parse(topPackageFile, true);
    packageDependencies = processAssetDependencies(topPackageFileJson, packageLocations);
    processAssets(packageLocations);

    for (let [key, value] of Object.entries(packageDependencies)) {
        let sorted = value.sort((a, b) => {
            return b.version > a.version
        })
        sortedPackageDependencies[sorted[0].name] = sorted[0].version;
    }
    packageAssetsJson = JSON.parse(JSON.stringify(sortedPackageDependencies));
    topPackageFileJson["dependencies"] = packageAssetsJson;
    fs.writeFileSync('/apps/webpack/package.json', JSON.stringify(topPackageFileJson), {encoding: "utf8"});

    packageLocations.forEach((location) => {
        let packageFiles = JSON.parse(fs.readFileSync(location.file, {}), true);
    });

}

const processAssetDependencies = (topPackageFileJson, packageLocations) => {

    let packageDependencies = [];

    for (let [key, value] of Object.entries(topPackageFileJson['dependencies'])) {
        if (packageDependencies[key] != undefined) {
            packageDependencies[key].push({name: key, version: value});
        } else {
            packageDependencies[key] = [];
            packageDependencies[key].push({name: key, version: value});
        }
    }

    packageLocations.forEach((location) => {
        let file = location.file;
        console.log(file);
        let packageFiles = JSON.parse(fs.readFileSync(file, {}), true);
        for (let [key, value] of Object.entries(packageFiles['dependencies'])) {
            if (packageDependencies[key] != undefined) {
                packageDependencies[key].push({name: key, version: value});
            } else {
                packageDependencies[key] = [];
                packageDependencies[key].push({name: key, version: value});
            }
        }
    });
    return packageDependencies;
}

const processAssets = (packageLocations) => {

    let alias = {};
    let frontendCssAssets = [];
    let frontendJsAssets = [];
    let backendCssAssets = [];
    let backendJsAssets = [];

    packageLocations.forEach((file) => {

        let content = JSON.parse(fs.readFileSync(file.file, {}), true);
        let config = JSON.parse(fs.readFileSync('/apps/webpack/config.json', {}), true);
        for (let [key, value] of Object.entries(content['webpack']['alias'])) {
            alias[key] = value;
        }
        config.aliases = alias;
        config.cssEntryPoints = {"main": "./../../css/source"}
        config.backendCssEntryPoints = {"main": "./../public_html/assets/backend/css"}
        config.jsEntryPoints = {"main": "./../public_html/assets/frontend/js"}
        config.backendJsEntryPoints = {"main": "./../public_html/assets/backend/js"}
        fs.writeFileSync('/apps/webpack/config.json', JSON.stringify(config), {encoding: "utf8"});


        if (!content['webpack']['assets']['frontend']['css']['separateEntryPoint']) {
            frontendCssAssets[file.name] = content['webpack']['assets']['frontend']['css'];
        } else {
            processSeparateCssAssets(content['webpack']['assets']['frontend']['css'], 'frontend', file, alias);
        }
        if (!content['webpack']['assets']['backend']['css']['separateEntryPoint']) {
            backendCssAssets[file.name] = content['webpack']['assets']['backend']['css'];
        } else {
            processSeparateCssAssets(content['webpack']['assets']['backend']['css'], 'backend', file);
        }

        if (!content['webpack']['assets']['frontend']['js']['separateEntryPoint']) {
            if(content['webpack']['assets']['frontend']['js']['files'].length) {
                frontendJsAssets[file.name] = content['webpack']['assets']['frontend']['js']['files'];
            }
        } else {
            processSeparateJsAssets(content['webpack']['assets']['frontend']['js']['files'], 'frontend', file, alias);
        }

        if (!content['webpack']['assets']['backend']['js']['separateEntryPoint']) {
            if(content['webpack']['assets']['backend']['js']['files'].length) {
                backendJsAssets[file.name] = content['webpack']['assets']['backend']['js']['files'];
            }
        } else {
            processSeparateJsAssets(content['webpack']['assets']['backend']['js']['files'], 'backend', file, alias);
        }
    });

    processMainCssAssets(frontendCssAssets, 'frontend', alias)
    processMainCssAssets(backendCssAssets, 'backend', alias)

    processMainJsAssets(frontendJsAssets, 'frontend', alias)
    processMainJsAssets(backendJsAssets, 'backend', alias)
}



const processMainCssAssets = (assets, location, alias) => {

    let dir = '/css/source/';
    let standard = [];
    let mediaQueries = {};
    let lib = [];

    creatDir(location);
    createFiles(dir);

    for (let [key, value] of Object.entries(assets)) {
        for (let [key2, value2] of Object.entries(value)) {
            if (key2 == "standard") {
                value2.forEach((path) => {
                    standard.push(path);
                });
            } else if (key2 == "lib") {
                value2.forEach((path) => {
                    lib.push(path);
                });
            } else if (key2 != "separateEntryPoint") {
                if (mediaQueries[key2] == undefined) {
                    mediaQueries[key2] = [];
                }
                value2.forEach((path) => {
                    mediaQueries[key2].push(path);
                });
            }
        }
    }

    let combinedAssets = standard.concat(flat(mediaQueries).reverse());
    for (let [key, value] of Object.entries(lib)) {
        fs.appendFileSync(dir + '/css/lib.config.js', "import '" + value + "';\n", {encoding: "utf8"});
    }
    for (let [key, value] of Object.entries(combinedAssets)) {
        if(value.indexOf("lib.min.css") !== -1) {
            var index = value.indexOf("lib.min.css");
            value = dir + "/dist/" + value.substring(index);
            value = value.replace("/public_html", "");
        }
        fs.appendFileSync(dir + '/css/app.config.js', "import '" + value + "';\n", {encoding: "utf8"});
    }
    for (let [key, value] of Object.entries(combinedAssets)) {
        let replacedValue = "";
        for (let [key2, value2] of Object.entries(alias)) {
            if (value.includes(key2) && value.includes("lib.min.css") === false) {
                let reg = new RegExp(key2, "g");
                replacedValue = value.replace(reg, value2).replace("../public_html", "");
            }
            if(value.indexOf("lib.min.css") !== -1) {
                index = value.indexOf("lib.min.css");
                value = dir + "/dist/" + value.substring(index);
                replacedValue = value.replace("/public_html", "");
            }
        }
        fs.appendFileSync(dir + '/css/app.config.css', "@import url('" + replacedValue + "');\n", {encoding: "utf8"});
    }
}

const processMainJsAssets = (assets, location, alias) => {

    let dir = '/public_html/assets/' + location;

    creatJsDir(location);
    createJsFiles(dir);

    let i = 0;
    for (let [key, value] of Object.entries(assets)) {
        value.forEach((path) => {
            let assetName = key + "_" + i;
            fs.appendFileSync(dir + '/js/main.js', "import * as " + assetName + " from '" + path + "';\n", {encoding: "utf8"});
            fs.appendFileSync(dir + '/js/main.js', assetName + ".run();\n", {encoding: "utf8"});
            i++;
        });
    }
}


const processSeparateCssAssets = (assets, location, file, alias) => {

    let dir = '/public_html/assets/' + location + '/' + file.name;
    let standard = [];
    let mediaQueries = {};
    let lib = [];

    creatDir(location, file);
    createFiles(dir);

    let config = JSON.parse(fs.readFileSync('/apps/webpack/config.json', {}), true);
    config.cssEntryPoints[file.name] = "./.." + dir + '/css';
    fs.writeFileSync('/apps/webpack/config.json', JSON.stringify(config), {encoding: "utf8"});



    for (let [key, value] of Object.entries(assets)) {
        if (key == "standard") {
            value.forEach((path) => {
                standard.push(path);
            });
        } else if (key == "lib") {
            value.forEach((path) => {
                lib.push(path);
            });
        } else if (key != "separateEntryPoint") {
            if (mediaQueries[key] == undefined) {
                mediaQueries[key] = [];
            }
            value.forEach((path) => {
                mediaQueries[key].push(path);
            });
        }
    }

    let combinedAssets = standard.concat(flat(mediaQueries).reverse());
    for (let [key, value] of Object.entries(lib)) {
        fs.appendFileSync(dir + '/css/lib.config.js', "import '" + value + "';\n", {encoding: "utf8"});
    }
    for (let [key, value] of Object.entries(combinedAssets)) {
        if(value.indexOf("lib.min.css") !== -1) {
            var index = value.indexOf("lib.min.css");
            value = dir + "/dist/" + value.substring(index);
            value = value.replace("/public_html", "");
        }
        fs.appendFileSync(dir + '/css/app.config.js', "import '" + value + "';\n", {encoding: "utf8"});
    }
    for (let [key, value] of Object.entries(combinedAssets)) {
        let replacedValue = "";
        for (let [key2, value2] of Object.entries(alias)) {
            if (value.includes(key2)) {
                let reg = new RegExp(key2, "g");
                replacedValue = value.replace(reg, value2).replace("../public_html", "");
            }
            if(value.indexOf("lib.min.css") !== -1) {
                index = value.indexOf("lib.min.css");
                value = dir + "/dist/" + value.substring(index);
                replacedValue = value.replace("/public_html", "");
            }
        }
        fs.appendFileSync(dir + '/css/app.config.css', "@import url('" + replacedValue + "');\n", {encoding: "utf8"});
    }

}

const processSeparateJsAssets = (assets, location, file, alias) => {

    let dir = '/public_html/assets/' + location + '/' + file.name;

    creatJsDir(location, file);
    createJsFiles(dir);

    let config = JSON.parse(fs.readFileSync('/webpack/config.json', {}), true);
    config.jsEntryPoints[file.name] = "./.." + dir + '/js';
    fs.writeFileSync('/webpack/config.json', JSON.stringify(config), {encoding: "utf8"});
    
    for (let [key, value] of Object.entries(assets)) {
        value.forEach((path) => {
            let assetName = file.name + "_" + i;
            fs.appendFileSync(dir + '/js/main.js', "import * as " + assetName + " from '" + path + "';\n", {encoding: "utf8"});
            fs.appendFileSync(dir + '/js/main.js', assetName + ".run();\n", {encoding: "utf8"});
            i++;
        });
    }
}

const creatDir = (location, file = null) => {

    let separate = "";

    if (file !== null) {
        separate = '/' + file.name
    }

    if (!fs.existsSync('/public_html/assets')) {
        fs.mkdirSync('/public_html/assets');
    }
    if (!fs.existsSync('/public_html/assets/' + location + separate)) {
        fs.mkdirSync('/public_html/assets/' + location + separate)
    }
    if (!fs.existsSync('/public_html/assets/' + location + separate + '/css')) {
        fs.mkdirSync('/public_html/assets/' + location + separate + '/css');
    }
    if (!fs.existsSync('/public_html/assets/' + location + separate + '/dist')) {
        fs.mkdirSync('/public_html/assets/' + location + separate + '/dist');
    }
}

const creatJsDir = (location, file = null) => {

    let separate = "";

    if (file !== null) {
        separate = '/' + file.name
    }

    if (!fs.existsSync('/public_html/assets/' + location + separate + '/js')) {
        fs.mkdirSync('/public_html/assets/' + location + separate + '/js');
    }
}

const createFiles = (dir) => {
    fs.writeFileSync(dir + '/css/lib.config.js', "", {encoding: "utf8"});
    fs.writeFileSync(dir + '/css/app.config.js', "", {encoding: "utf8"});
    fs.writeFileSync(dir + '/css/app.config.css', "", {encoding: "utf8"});
}

const createJsFiles = (dir) => {
    fs.writeFileSync(dir + '/js/main.js', "", {encoding: "utf8"});
}

const flat = (input) => {
    return Object.keys(input).reduce(function (r, k) {
        return r.concat(input[k]);
    }, []);
}

console.log('Starting asset processing...');
processPackageFiles();
console.log('Completed asset processing!');
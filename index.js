const path = require('path');
const fs = require('fs');

class FileExtractPlugin
{
  get pluginName()
  {
    return 'FileExtractPlugin';
  };

  constructor(options)
  {
    this.options = Object.assign({'output': {}}, options);
  }

  apply(compiler)
  {
    let files = {};

    compiler.hooks.compilation.tap(
      this.pluginName, compilation =>
      {
        compilation.hooks.chunkAsset.tap(
          this.pluginName, chunk =>
          {
            let shouldRun = true;
            if(this.options.match)
            {
              shouldRun = false;
              if(!Array.isArray(this.options.match))
              {
                this.options.match = [this.options.match];
              }
              this.options.match.forEach(
                match => shouldRun = match.test(chunk.entryModule.resource)
              );
            }

            if(shouldRun)
            {
              let outputFilename = this.options.output.filename
                || chunk.entryModule.resource.split(/[\\/]node_modules[\\/]/).pop();
              if(this.options.output.path)
              {
                outputFilename = path.resolve(this.options.output.path, outputFilename);
              }
              let source = fs.readFileSync(chunk.entryModule.resource, 'utf8');
              if(source)
              {
                if(!files[outputFilename])
                {
                  files[outputFilename] = '';
                }
                files[outputFilename] += source;
              }
            }
          }
        );
      }
    );

    compiler.hooks.emit.tap(
      this.pluginName,
      (compilation) =>
      {
        Object.keys(files).forEach(
          filename =>
          {
            let source = files[filename];
            compilation.assets[filename] = {
              source: function ()
              {
                return source;
              },
              size: function ()
              {
                return source.length;
              }
            };
          }
        );
      }
    );
  }
}

module.exports = FileExtractPlugin;

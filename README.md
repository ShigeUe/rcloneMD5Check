# rcloneでFTPを使う時のヘルパー

rcloneでftpを使ってmd5sumを取り、ローカルとftp側で同期しやすいようにします。

rcloneはできればリモートシステムのmd5sumを取ろうとしますが、ftpでは対応していないシステムが多いようです。  
それで `rclone md5sum --download` コマンドを使いリモートのmd5sumを取りローカルと突合します。  
その結果をstdoutに出力することでrcloneに渡すことができ、変更のあるファイルだけを同期することができます。

ファイルをすべてダウンロードしてmd5sumを作るので効率が悪いように思いますが、`--size-only`だと検出できない変更も検出できますし、不要なファイルをアップロードしないのでタイムスタンプの変更もありません。

## 使い方

リポジトリをclone後、ソースファイルのあるディレクトリに移動します。    
`deno compile --allow-run rcloneMD5Check.ts` でコンパイルできます。  
パスの通ったディレクトリにコピーしてください。  
（rcloneもパスを通しておく必要があります）

`rcloneMD5Check.exe <local-path> <remote-path>` の形式で利用します。  
`remote-path` はrcloneの `リモート名:絶対パス` の形式になります。

一例としてブログのアップロードに使用しているコマンドは

```powershell
rcloneMD5Check.exe ./public/ eicon:/home/eicon/www/ | rclone sync ./public/ eicon:/home/eicon/www/ --files-from -
```

になります。  
最後の `-` は標準入力から読み取りなので省略しないでください。

`--dry-run` を付けてチェックすることを忘れないようにしてください。

　

# Helper for Using FTP with rclone  

This guide explains how to use FTP with rclone to generate MD5 checksums, making it easier to synchronize files between a local system and an FTP server.  

rclone attempts to retrieve MD5 checksums from remote systems whenever possible, but many FTP servers do not support this feature.  
To work around this, you can use the `rclone md5sum --download` command to calculate the MD5 checksums of remote files by downloading them and comparing them with local files.  
The results are output to stdout, allowing rclone to synchronize only the modified files.  

Although downloading all files to generate MD5 checksums may seem inefficient, this method can detect changes that `--size-only` might miss. Additionally, since unnecessary files are not uploaded, timestamps remain unchanged.  

## Usage  

After cloning the repository, navigate to the directory containing the source files.  
Compile the script using the following command:  
```powershell
deno compile --allow-run rcloneMD5Check.ts
```
Copy the compiled executable to a directory included in your system's PATH.  
(Note: rclone also needs to be accessible via PATH.)  

Use the command in the following format:  
```powershell
rcloneMD5Check.exe <local-path> <remote-path>
```
The `remote-path` should follow the format `remote-name:absolute-path` used by rclone.  

For example, to upload a blog, you can use the following command:  

```powershell
rcloneMD5Check.exe ./public/ eicon:/home/eicon/www/ | rclone sync ./public/ eicon:/home/eicon/www/ --files-from -
```
Make sure not to omit the final `-`, as it indicates reading from standard input.  

Don't forget to add `--dry-run` to verify the process before executing the actual synchronization.

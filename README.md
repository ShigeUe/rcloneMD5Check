# rcloneでFTPを使う時のヘルパー

rcloneでローカルファイルのmd5sumを取り、差分のあるものだけを一覧表示します。

このコマンドを実行するとカレントディレクトリに `md5hashes.sqlite` というSQLiteのデータベースファイルを生成します。  
それに `rclone md5sum` コマンドで得たローカルフォルダのファイルのmd5の一覧を保存します。  
次回実行すると、そのデータベースとローカルフォルダのファイルのmd5を突合し、変化のあったものだけを標準出力に出力します。

それを `rclone` に入力することで、変更のあったものだけを同期できます。  
sizeonlyでは変化が取得できないようなものも検出できます。

## 使い方

リポジトリをclone後、ソースファイルのあるディレクトリに移動します。    
`deno compile --allow-run --allow-read --allow-write rcloneMD5Check.ts` でコンパイルできます。  
パスの通ったディレクトリにコピーしてください。  
（rcloneもパスを通しておく必要があります）

`rcloneMD5Check.exe <local-path>` の形式で利用します。  

一例としてブログのアップロードに使用しているコマンドは

```powershell
rcloneMD5Check.exe C:\Users\xxxx\Documents\blog\public | rclone sync C:\Users\xxxx\Documents\blog\public\ eicon:/home/eicon/www/ --files-from -
```

になります。  
最後の `-` は標準入力から読み取りなので省略しないでください。

`--dry-run` を付けてチェックすることを忘れないようにしてください。

---
# Helper for using rclone with FTP

This tool takes the md5sum of local files and lists only those with differences.

When you run this command, it generates an SQLite database file named `md5hashes.sqlite` in the current directory.
It stores the list of md5 hashes of the files in the local folder, obtained with the `rclone md5sum` command.
The next time you run it, it compares the database with the md5 hashes of the local files and outputs only the ones that have changed to standard output.

By piping this output to `rclone`, you can sync only the changed files.
It can also detect changes that cannot be picked up with the `--size-only` flag.

## Usage

After cloning the repository, move to the directory containing the source files.
You can compile it with `deno compile --allow-run --allow-read --allow-write rcloneMD5Check.ts`.
Please copy the executable to a directory in your PATH.
(rclone also needs to be in your PATH).

Use it in the format: `rcloneMD5Check.exe <local-path>`.

As an example, the command used to upload a blog is:

```powershell
rcloneMD5Check.exe C:\Users\xxxx\Documents\blog\public | rclone sync C:\Users\xxxx\Documents\blog\public\ eicon:/home/eicon/www/ --files-from -
```

The final `-` means reading from standard input, so please do not omit it.

Don't forget to check with the `--dry-run` flag first.



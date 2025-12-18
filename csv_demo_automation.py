#!/usr/bin/env python3
"""
CSV Demo Site Automation Script
================================
このスクリプトは、CSVデモサイトで以下の操作を自動化します：
1. ログイン（ID/パスワード形式）
2. CSVファイルのダウンロード
3. CSVデータの編集（特定の値を変更）
4. 編集したCSVファイルのアップロード
5. データ更新の確認

使用方法:
    python csv_demo_automation.py

必要なライブラリ:
    pip install selenium pandas
"""

import os
import time
import csv
import tempfile
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service


# =============================================================================
# 設定
# =============================================================================

# デモサイトのURL（実際のURLに変更してください）
BASE_URL = "https://3000-i4ckornb7xr8zealsn93s-fae02be0.sg1.manus.computer"

# ログイン情報
USERNAME = "demouser"
PASSWORD = "demo123456"

# CSV編集設定
# 変更対象: TestProduct2のQuantityを20から40に変更
TARGET_PRODUCT = "TestProduct2"
TARGET_COLUMN = "Quantity"
NEW_VALUE = "40"

# ダウンロードディレクトリ
DOWNLOAD_DIR = tempfile.mkdtemp()


# =============================================================================
# ブラウザ設定
# =============================================================================

def setup_driver():
    """Seleniumドライバーを設定して返す"""
    chrome_options = Options()
    
    # ヘッドレスモード（ブラウザ画面を表示しない）
    # chrome_options.add_argument("--headless")  # コメントアウトして画面表示
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")
    
    # ダウンロード設定
    prefs = {
        "download.default_directory": DOWNLOAD_DIR,
        "download.prompt_for_download": False,
        "download.directory_upgrade": True,
        "safebrowsing.enabled": True
    }
    chrome_options.add_experimental_option("prefs", prefs)
    
    driver = webdriver.Chrome(options=chrome_options)
    driver.implicitly_wait(10)
    
    return driver


# =============================================================================
# ログイン処理
# =============================================================================

def login(driver, username, password):
    """
    デモサイトにログインする
    
    Args:
        driver: Seleniumドライバー
        username: ユーザー名
        password: パスワード
    
    Returns:
        bool: ログイン成功時True
    """
    print(f"[INFO] ログインページにアクセス中...")
    driver.get(f"{BASE_URL}/login")
    
    wait = WebDriverWait(driver, 10)
    
    try:
        # ログインタブが選択されていることを確認
        login_tab = wait.until(
            EC.element_to_be_clickable((By.ID, "radix-_r_0_-trigger-login"))
        )
        login_tab.click()
        time.sleep(2)  # 2秒待機
        
        # ユーザー名を入力
        print(f"[INFO] ユーザー名を入力中: {username}")
        username_input = wait.until(
            EC.presence_of_element_located((By.ID, "login-username"))
        )
        username_input.clear()
        username_input.send_keys(username)
        time.sleep(2)  # 2秒待機
        
        # パスワードを入力
        print(f"[INFO] パスワードを入力中...")
        password_input = driver.find_element(By.ID, "login-password")
        password_input.clear()
        password_input.send_keys(password)
        time.sleep(2)  # 2秒待機
        
        # ログインボタンをクリック
        print(f"[INFO] ログインボタンをクリック...")
        # タブパネル内のログインボタンを特定（タブボタンではなく）
        login_button = driver.find_element(By.XPATH, "//div[@role='tabpanel']//button[contains(text(), 'ログイン')]")
        login_button.click()
        time.sleep(2)  # 2秒待機
        
        # ログイン成功を確認（ホームページにリダイレクトされる）
        wait.until(EC.url_to_be(f"{BASE_URL}/"))
        
        # ようこそメッセージが表示されることを確認
        wait.until(
            EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'ようこそ')]"))
        )
        
        print(f"[SUCCESS] ログイン成功！")
        time.sleep(2)  # 2秒待機
        return True
        
    except Exception as e:
        print(f"[ERROR] ログイン失敗: {e}")
        return False


def register_and_login(driver, username, password, display_name=""):
    """
    新規アカウントを作成してログインする
    
    Args:
        driver: Seleniumドライバー
        username: ユーザー名
        password: パスワード
        display_name: 表示名（オプション）
    
    Returns:
        bool: 登録・ログイン成功時True
    """
    print(f"[INFO] ログインページにアクセス中...")
    driver.get(f"{BASE_URL}/login")
    
    wait = WebDriverWait(driver, 10)
    
    try:
        # 新規登録タブをクリック
        register_tab = wait.until(
            EC.element_to_be_clickable((By.ID, "radix-_r_0_-trigger-register"))
        )
        register_tab.click()
        time.sleep(2)  # 2秒待機
        
        # ユーザー名を入力
        print(f"[INFO] ユーザー名を入力中: {username}")
        username_input = wait.until(
            EC.presence_of_element_located((By.ID, "register-username"))
        )
        username_input.clear()
        username_input.send_keys(username)
        time.sleep(2)  # 2秒待機
        
        # パスワードを入力
        print(f"[INFO] パスワードを入力中...")
        password_input = driver.find_element(By.ID, "register-password")
        password_input.clear()
        password_input.send_keys(password)
        time.sleep(2)  # 2秒待機
        
        # 表示名を入力（オプション）
        if display_name:
            print(f"[INFO] 表示名を入力中: {display_name}")
            name_input = driver.find_element(By.ID, "register-name")
            name_input.clear()
            name_input.send_keys(display_name)
            time.sleep(2)  # 2秒待機
        
        # アカウント作成ボタンをクリック
        print(f"[INFO] アカウント作成ボタンをクリック...")
        register_button = driver.find_element(By.XPATH, "//div[@role='tabpanel']//button[contains(text(), 'アカウント作成')]")
        register_button.click()
        time.sleep(2)  # 2秒待機
        
        # 登録成功を確認（ホームページにリダイレクトされる）
        wait.until(EC.url_to_be(f"{BASE_URL}/"))
        
        print(f"[SUCCESS] アカウント作成・ログイン成功！")
        time.sleep(2)  # 2秒待機
        return True
        
    except Exception as e:
        print(f"[ERROR] アカウント作成失敗: {e}")
        # 既存アカウントの場合はログインを試みる
        print(f"[INFO] 既存アカウントでログインを試みます...")
        return login(driver, username, password)


# =============================================================================
# CSVダウンロード処理
# =============================================================================

def download_csv(driver):
    """
    CSVファイルをダウンロードする
    
    Args:
        driver: Seleniumドライバー
    
    Returns:
        str: ダウンロードしたCSVの内容、失敗時はNone
    """
    print(f"[INFO] CSVダウンロードを開始...")
    
    wait = WebDriverWait(driver, 10)
    
    try:
        # CSVダウンロードボタンをクリック
        download_button = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'CSVダウンロード')]"))
        )
        download_button.click()
        time.sleep(2)  # 2秒待機
        
        # ダウンロード完了を待機
        time.sleep(2)  # 2秒待機
        
        # ダウンロードしたファイルを確認
        csv_file = os.path.join(DOWNLOAD_DIR, "data.csv")
        
        if os.path.exists(csv_file):
            with open(csv_file, 'r', encoding='utf-8') as f:
                content = f.read()
            print(f"[SUCCESS] CSVダウンロード成功！")
            print(f"[INFO] ダウンロードしたCSV内容:\n{content}")
            time.sleep(2)  # 2秒待機
            return content
        else:
            # ファイルがダウンロードされていない場合、画面からデータを取得
            print(f"[INFO] ダウンロードファイルが見つかりません。画面からデータを取得します...")
            return get_csv_from_table(driver)
            
    except Exception as e:
        print(f"[ERROR] CSVダウンロード失敗: {e}")
        return None


def get_csv_from_table(driver):
    """
    画面上のテーブルからCSVデータを取得する
    
    Args:
        driver: Seleniumドライバー
    
    Returns:
        str: CSV形式の文字列
    """
    try:
        # テーブルの行を取得
        rows = driver.find_elements(By.XPATH, "//table//tbody//tr")
        
        csv_lines = ["Product,Quantity,Price"]
        
        for row in rows:
            cells = row.find_elements(By.TAG_NAME, "td")
            if len(cells) >= 4:
                product = cells[1].text
                quantity = cells[2].text
                price = cells[3].text.replace("¥", "").replace(",", "")
                csv_lines.append(f"{product},{quantity},{price}")
        
        csv_content = "\n".join(csv_lines)
        print(f"[INFO] テーブルから取得したCSV:\n{csv_content}")
        return csv_content
        
    except Exception as e:
        print(f"[ERROR] テーブルからのデータ取得失敗: {e}")
        return None


# =============================================================================
# CSV編集処理
# =============================================================================

def edit_csv(csv_content, target_product, target_column, new_value):
    """
    CSVデータを編集する
    
    Args:
        csv_content: CSV文字列
        target_product: 変更対象の製品名
        target_column: 変更対象の列名
        new_value: 新しい値
    
    Returns:
        str: 編集後のCSV文字列
    """
    print(f"[INFO] CSVデータを編集中...")
    print(f"[INFO] 対象: {target_product} の {target_column} を {new_value} に変更")
    
    lines = csv_content.strip().split("\n")
    headers = lines[0].split(",")
    
    try:
        column_index = headers.index(target_column)
    except ValueError:
        print(f"[ERROR] 列 '{target_column}' が見つかりません")
        return csv_content
    
    edited_lines = [lines[0]]
    
    for line in lines[1:]:
        values = line.split(",")
        if values[0] == target_product:
            old_value = values[column_index]
            values[column_index] = new_value
            print(f"[INFO] {target_product}: {target_column} を {old_value} から {new_value} に変更")
        edited_lines.append(",".join(values))
    
    edited_csv = "\n".join(edited_lines)
    print(f"[SUCCESS] CSV編集完了！")
    print(f"[INFO] 編集後のCSV:\n{edited_csv}")
    
    return edited_csv


# =============================================================================
# CSVアップロード処理
# =============================================================================

def upload_csv(driver, csv_content):
    """
    編集したCSVファイルをアップロードする
    
    Args:
        driver: Seleniumドライバー
        csv_content: アップロードするCSV文字列
    
    Returns:
        bool: アップロード成功時True
    """
    print(f"[INFO] CSVアップロードを開始...")
    
    # 一時ファイルにCSVを保存
    temp_csv_path = os.path.join(DOWNLOAD_DIR, "upload_data.csv")
    with open(temp_csv_path, 'w', encoding='utf-8') as f:
        f.write(csv_content)
    
    print(f"[INFO] 一時ファイルを作成: {temp_csv_path}")
    
    wait = WebDriverWait(driver, 10)
    
    try:
        # ファイル入力要素を見つける
        file_input = driver.find_element(By.CSS_SELECTOR, "input[type='file']")
        
        # ファイルをアップロード
        file_input.send_keys(temp_csv_path)
        time.sleep(2)  # 2秒待機
        
        # アップロード完了を待機
        time.sleep(2)  # 2秒待機
        
        # 成功メッセージを確認
        try:
            success_message = wait.until(
                EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'インポートしました')]"))
            )
            print(f"[SUCCESS] CSVアップロード成功！ メッセージ: {success_message.text}")
            time.sleep(2)  # 2秒待機
            return True
        except:
            print(f"[INFO] 成功メッセージが見つかりませんでしたが、アップロードは完了した可能性があります")
            return True
            
    except Exception as e:
        print(f"[ERROR] CSVアップロード失敗: {e}")
        return False


# =============================================================================
# データ確認処理
# =============================================================================

def verify_data_update(driver, target_product, target_column, expected_value):
    """
    データが正しく更新されたか確認する
    
    Args:
        driver: Seleniumドライバー
        target_product: 確認対象の製品名
        target_column: 確認対象の列名
        expected_value: 期待する値
    
    Returns:
        bool: 更新が確認できた場合True
    """
    print(f"[INFO] データ更新を確認中...")
    
    # ページをリフレッシュ
    driver.refresh()
    time.sleep(2)
    
    try:
        # テーブルの行を取得
        rows = driver.find_elements(By.XPATH, "//table//tbody//tr")
        
        for row in rows:
            cells = row.find_elements(By.TAG_NAME, "td")
            if len(cells) >= 4:
                product = cells[1].text
                quantity = cells[2].text
                
                if product == target_product:
                    if quantity == expected_value:
                        print(f"[SUCCESS] データ更新確認完了！")
                        print(f"[INFO] {target_product} の {target_column} = {quantity}")
                        return True
                    else:
                        print(f"[WARNING] 値が期待と異なります: 期待={expected_value}, 実際={quantity}")
                        return False
        
        print(f"[ERROR] 対象製品 '{target_product}' が見つかりません")
        return False
        
    except Exception as e:
        print(f"[ERROR] データ確認失敗: {e}")
        return False


# =============================================================================
# メイン処理
# =============================================================================

def main():
    """メイン処理"""
    print("=" * 60)
    print("CSV Demo Site Automation Script")
    print("=" * 60)
    print(f"対象サイト: {BASE_URL}")
    print(f"ユーザー名: {USERNAME}")
    print(f"変更内容: {TARGET_PRODUCT} の {TARGET_COLUMN} を {NEW_VALUE} に変更")
    print("=" * 60)
    
    driver = None
    
    try:
        # ブラウザを起動
        print("\n[STEP 1] ブラウザを起動中...")
        driver = setup_driver()
        
        # ログイン（または新規登録）
        print("\n[STEP 2] ログイン処理...")
        if not login(driver, USERNAME, PASSWORD):
            # ログイン失敗の場合は新規登録を試みる
            if not register_and_login(driver, USERNAME, PASSWORD, "デモユーザー"):
                raise Exception("ログインに失敗しました")
        
        # CSVダウンロード
        print("\n[STEP 3] CSVダウンロード...")
        csv_content = download_csv(driver)
        if not csv_content:
            # ダウンロードできない場合はデフォルトのCSVを使用
            csv_content = "Product,Quantity,Price\nTestProduct1,10,1000\nTestProduct2,20,2000"
            print(f"[INFO] デフォルトのCSVデータを使用します")
        
        # CSV編集
        print("\n[STEP 4] CSVデータ編集...")
        edited_csv = edit_csv(csv_content, TARGET_PRODUCT, TARGET_COLUMN, NEW_VALUE)
        
        # CSVアップロード
        print("\n[STEP 5] CSVアップロード...")
        if not upload_csv(driver, edited_csv):
            raise Exception("CSVアップロードに失敗しました")
        
        # データ更新確認
        print("\n[STEP 6] データ更新確認...")
        if verify_data_update(driver, TARGET_PRODUCT, TARGET_COLUMN, NEW_VALUE):
            print("\n" + "=" * 60)
            print("[COMPLETE] 全ての処理が正常に完了しました！")
            print("=" * 60)
        else:
            print("\n[WARNING] データ更新の確認ができませんでした")
        
    except Exception as e:
        print(f"\n[FATAL ERROR] {e}")
        
    finally:
        # ブラウザを閉じる
        if driver:
            print("\n[INFO] ブラウザを閉じています...")
            driver.quit()
        
        # 一時ファイルをクリーンアップ
        import shutil
        if os.path.exists(DOWNLOAD_DIR):
            shutil.rmtree(DOWNLOAD_DIR)
            print(f"[INFO] 一時ディレクトリを削除しました: {DOWNLOAD_DIR}")


if __name__ == "__main__":
    main()

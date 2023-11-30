
CREATE DATABASE IF NOT EXISTS `ezd_finance_db` CHARACTER SET utf8mb4;

use `ezd_finance_db`;

-- CREATE USER `ezd`@`%`



CREATE TABLE IF NOT EXISTS `currency` (
  `CurrencyID` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  /*
    Need 3 per ISO 4217 (see: https://en.wikipedia.org/wiki/ISO_4217)
      Decided on 4 chars for future proofing
  */
  `Code` VARCHAR(4) NOT NULL,
  `CreatedAt`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `LastModified` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`CurrencyID`),
  UNIQUE KEY `currency_code` (`Code`)
) ENGINE=INNODB;

CREATE TABLE IF NOT EXISTS `category` (
  `CategoryID` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `Name` VARCHAR(300),
  `CreatedAt`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `LastModified` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`CategoryID`)
  -- UNIQUE KEY `category_name` (`Name`)
) ENGINE=INNODB;

CREATE TABLE IF NOT EXISTS `account` (
  `AccountID` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `Name` VARCHAR(300),
  `CreatedAt`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `LastModified` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`AccountID`)
) ENGINE=INNODB;

CREATE TABLE IF NOT EXISTS `transaction` (
  `TransactionID` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `Date` DATETIME NOT NULL,
  `Description` VARCHAR(300),
  `OriginalDescription` VARCHAR(300),
  /*
    Chosen based on reading several stack overflow posts. See: https://stackoverflow.com/a/628639
  */
  `Amount` DECIMAL(19,4) NOT NULL,
  `TransactionType` ENUM('credit', 'debit') NOT NULL,
  `Labels` VARCHAR(300),
  `Notes` VARCHAR(300),
  `CurrencyID` BIGINT(20) UNSIGNED NOT NULL,
  `CategoryID` BIGINT(20) UNSIGNED NOT NULL,
  `AccountID` BIGINT(20) UNSIGNED NOT NULL,
  `CreatedAt`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `LastModified` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`TransactionID`),
  CONSTRAINT `transaction_currencyid` FOREIGN KEY (`CurrencyID`) REFERENCES `currency` (`CurrencyID`) ON DELETE CASCADE,
  CONSTRAINT `transaction_categoryid` FOREIGN KEY (`CategoryID`) REFERENCES `category` (`CategoryID`) ON DELETE CASCADE,
  CONSTRAINT `transaction_accountid` FOREIGN KEY (`AccountID`) REFERENCES `account` (`AccountID`) ON DELETE CASCADE
) ENGINE=INNODB;

INSERT INTO `currency` (`CurrencyID`, `Code`) VALUES(1, 'USD');

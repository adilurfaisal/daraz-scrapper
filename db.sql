/*
SQLyog Community v13.1.9 (64 bit)
MySQL - 10.4.27-MariaDB : Database - daraz
*********************************************************************
*/

/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE /*!32312 IF NOT EXISTS*/`daraz` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;

USE `daraz`;

/*Table structure for table `product_img_ini` */

DROP TABLE IF EXISTS `product_img_ini`;

CREATE TABLE `product_img_ini` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `prod_id` bigint(20) DEFAULT 0,
  `img_src` mediumtext DEFAULT NULL,
  `update_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `prod_img` (`prod_id`,`img_src`) USING HASH
) ENGINE=InnoDB AUTO_INCREMENT=3380 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Table structure for table `product_list_ini` */

DROP TABLE IF EXISTS `product_list_ini`;

CREATE TABLE `product_list_ini` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `handle` varchar(100) DEFAULT NULL,
  `title` varchar(200) DEFAULT NULL,
  `link` mediumtext DEFAULT NULL,
  `thumbnail` mediumtext DEFAULT NULL,
  `price` double(10,2) DEFAULT 0.00,
  `rate` double(10,1) DEFAULT 0.0,
  `total_rate` bigint(20) DEFAULT 0,
  `page_num` bigint(20) DEFAULT 0,
  `vendor` varchar(100) DEFAULT NULL,
  `tags` mediumtext DEFAULT NULL,
  `product_category` varchar(200) DEFAULT NULL,
  `product_type` varchar(200) DEFAULT NULL,
  `img_src` mediumtext DEFAULT NULL,
  `create_time` datetime DEFAULT NULL,
  `update_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `handle` (`handle`),
  UNIQUE KEY `link` (`link`) USING HASH
) ENGINE=InnoDB AUTO_INCREMENT=1604 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*Table structure for table `product_variant_ini` */

DROP TABLE IF EXISTS `product_variant_ini`;

CREATE TABLE `product_variant_ini` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `prod_id` bigint(20) NOT NULL DEFAULT 0,
  `option_1_name` varchar(100) DEFAULT NULL,
  `option_1_value` varchar(200) DEFAULT NULL,
  `option_2_name` varchar(100) DEFAULT NULL,
  `option_2_value` varchar(200) DEFAULT NULL,
  `option_3_name` varchar(100) DEFAULT NULL,
  `option_3_value` varchar(200) DEFAULT NULL,
  `option_4_name` varchar(100) DEFAULT NULL,
  `option_4_value` varchar(200) DEFAULT NULL,
  `variant_img` mediumtext DEFAULT NULL,
  `variant_img_sm` mediumtext DEFAULT NULL,
  `sku` varchar(200) DEFAULT NULL,
  `qty` double(10,2) DEFAULT 0.00,
  `price` double(10,2) DEFAULT 0.00,
  `create_time` datetime DEFAULT NULL,
  `update_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sku` (`sku`),
  UNIQUE KEY `prod_option` (`prod_id`,`option_1_name`,`option_1_value`,`option_2_name`,`option_2_value`,`option_3_name`,`option_3_value`,`option_4_name`,`option_4_value`) USING HASH
) ENGINE=InnoDB AUTO_INCREMENT=16396 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
